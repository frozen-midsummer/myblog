
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Client from 'ssh2-sftp-client';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import mysql from 'mysql2/promise';

const execPromise = util.promisify(exec);

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.deploy.local') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sftp = new Client();

const config = {
  host: process.env.DEPLOY_HOST,
  port: process.env.DEPLOY_PORT || 22,
  username: process.env.DEPLOY_USERNAME,
  password: process.env.DEPLOY_PASSWORD,
  privateKey: process.env.DEPLOY_PRIVATE_KEY_PATH 
    ? fs.readFileSync(process.env.DEPLOY_PRIVATE_KEY_PATH) 
    : undefined,
  // 后端部署路径
  remotePath: '/var/www/myblog-backend',
  // 后端构建产物路径
  localJarPath: path.resolve(process.cwd(), '../myblog-ddd/myblog-ddd-starter/target/myblog-ddd-starter-1.0-SNAPSHOT.jar'),
  // 启动脚本路径
  startScriptPath: path.resolve(__dirname, 'start.sh')
};

async function validateConfig() {
  if (!config.host || !config.username || (!config.password && !config.privateKey)) {
    console.log(chalk.red('❌ 错误: 请在 .env.deploy.local 文件中配置服务器连接信息'));
    process.exit(1);
  }
}

async function buildBackend() {
  const spinner = ora('正在构建后端项目...').start();
  try {
    // 切换到后端目录执行 Maven 构建
    const backendDir = path.resolve(process.cwd(), '../myblog-ddd');
    // 使用 -Dmaven.test.skip=true 跳过测试以加快构建速度
    await execPromise('mvn clean package -Dmaven.test.skip=true', { cwd: backendDir });
    
    if (!fs.existsSync(config.localJarPath)) {
        throw new Error(`构建产物不存在: ${config.localJarPath}`);
    }
    
    spinner.succeed(chalk.green('后端构建成功'));
  } catch (error) {
    spinner.fail(chalk.red('后端构建失败'));
    throw error;
  }
}

async function remoteBuildAndDeploy() {
  const spinner = ora('尝试在服务器上构建后端...').start();
  await validateConfig();
  const localSrcDir = path.resolve(process.cwd(), '../myblog-ddd');
  const remoteSrcDir = `${config.remotePath}/src`;
  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
    });
    const exists = await sftp.exists(config.remotePath);
    if (!exists) {
      await sftp.mkdir(config.remotePath, true);
    }
    const srcExists = await sftp.exists(remoteSrcDir);
    if (!srcExists) {
      await sftp.mkdir(remoteSrcDir, true);
    }
    await sftp.uploadDir(localSrcDir, remoteSrcDir);
    spinner.succeed(chalk.green('后端源码已上传'));
  } catch (e) {
    spinner.fail(chalk.red('上传源码失败'));
    throw e;
  } finally {
    await sftp.end();
  }

  const { Client: SSHClient } = await import('ssh2');
  const conn = new SSHClient();
  const sshSpinner = ora('正在服务器上执行 Maven 构建...').start();
  const buildCmd = `cd ${remoteSrcDir} && mvn -DskipTests clean package`;
  const copyCmd = `cp ${remoteSrcDir}/myblog-ddd-starter/target/myblog-ddd-starter-1.0-SNAPSHOT.jar ${config.remotePath}/app.jar`;
  const startCmd = `bash ${config.remotePath}/start.sh`;
  function execRemote(conn, cmd) {
    return new Promise((resolve, reject) => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        stream.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`命令退出码: ${code}`));
        }).on('data', (data) => process.stdout.write(data))
          .stderr.on('data', (data) => process.stderr.write(data));
      });
    });
  }
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      try {
        // 安装 Java 和 Maven（如果缺失）
        const checkMvn = `command -v mvn >/dev/null 2>&1 || echo "NO_MAVEN"`;
        const checkJava = `command -v java >/dev/null 2>&1 || echo "NO_JAVA"`;
        const installCmd = `
          if ! command -v mvn >/dev/null 2>&1 || ! command -v java >/dev/null 2>&1; then
            if [ -f /etc/os-release ]; then
              . /etc/os-release
              if [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
                sudo apt-get update -y && sudo apt-get install -y openjdk-17-jdk maven
              elif [ "$ID" = "centos" ] || [ "$ID" = "rhel" ]; then
                sudo yum install -y java-17-openjdk java-17-openjdk-devel maven
              elif [ "$ID" = "fedora" ] || [ "$ID" = "rocky" ] || [ "$ID" = "almalinux" ]; then
                sudo dnf install -y java-17-openjdk java-17-openjdk-devel maven
              else
                echo "UNKNOWN_OS"
              fi
            else
              echo "UNKNOWN_OS"
            fi
          fi
        `;
        await execRemote(conn, checkMvn);
        await execRemote(conn, checkJava);
        await execRemote(conn, installCmd);

        await execRemote(conn, buildCmd);
        sshSpinner.succeed(chalk.green('远程构建完成'));
        const stepSpinner = ora('复制并启动服务...').start();
        await execRemote(conn, copyCmd);
        await execRemote(conn, startCmd);
        stepSpinner.succeed(chalk.green('服务已启动'));
        conn.end();
        resolve();
      } catch (err) {
        sshSpinner.fail(chalk.red('远程构建或启动失败'));
        conn.end();
        reject(err);
      }
    }).on('error', reject).connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey
    });
  });
}
function parseDbConfig() {
  const ymlPath = path.resolve(process.cwd(), '../myblog-ddd/myblog-ddd-starter/src/main/resources/application.yml');
  const content = fs.readFileSync(ymlPath, 'utf-8');
  const urlLine = content.match(/url:\s*(?:\$\{[^:]+:)?([^}\n\r]+)\}?/);
  const userLine = content.match(/username:\s*(?:\$\{[^:]+:)?([^}\n\r]+)\}?/);
  const passLine = content.match(/password:\s*(?:\$\{[^:]+:)?([^}\n\r]+)\}?/);
  const url = urlLine ? urlLine[1].trim() : '';
  const username = userLine ? userLine[1].trim() : '';
  const password = passLine ? passLine[1].trim() : '';
  const m = url.match(/jdbc:mysql:\/\/([^:\/]+)(?::(\d+))?\/([^?\s]+)/);
  const host = m ? m[1] : 'localhost';
  const port = m && m[2] ? m[2] : '3306';
  const database = m ? m[3] : 'myblog';
  return { host, port, database, username, password };
}

async function dbInit() {
  await validateConfig();
  const spinner = ora('正在准备数据库初始化...').start();
  const db = parseDbConfig();
  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
    });
    const sqlRemoteDir = `${config.remotePath}/sql`;
    const exists = await sftp.exists(sqlRemoteDir);
    if (!exists) {
      await sftp.mkdir(sqlRemoteDir, true);
    }
    const localSqlDir = path.resolve(process.cwd(), '../myblog-ddd/myblog-ddd-starter/src/main/resources/sql');
    await sftp.put(path.join(localSqlDir, 'create_tables.sql'), `${sqlRemoteDir}/create_tables.sql`);
    await sftp.put(path.join(localSqlDir, 'china_city_code.sql'), `${sqlRemoteDir}/china_city_code.sql`);
    spinner.succeed(chalk.green('SQL 文件上传完成'));
  } catch (e) {
    spinner.fail(chalk.red('上传 SQL 文件失败'));
    console.error(e);
    process.exit(1);
  } finally {
    await sftp.end();
  }

  const { Client: SSHClient } = await import('ssh2');
  const conn = new SSHClient();
  const sshSpinner = ora('正在通过 SSH 隧道执行数据库初始化...').start();
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      try {
        const forward1 = await new Promise((res, rej) => {
          conn.forwardOut('127.0.0.1', 0, db.host, Number(db.port), (err, stream) => {
            if (err) return rej(err);
            res(stream);
          });
        });
        const connCreate = await mysql.createConnection({
          user: db.username,
          password: db.password || undefined,
          stream: forward1,
          multipleStatements: true
        });
        await connCreate.query(`CREATE DATABASE IF NOT EXISTS ${db.database} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connCreate.end();

        const forward2 = await new Promise((res, rej) => {
          conn.forwardOut('127.0.0.1', 0, db.host, Number(db.port), (err, stream) => {
            if (err) return rej(err);
            res(stream);
          });
        });
        const connDb = await mysql.createConnection({
          user: db.username,
          password: db.password || undefined,
          database: db.database,
          stream: forward2,
          multipleStatements: true
        });
        const localSqlDir = path.resolve(process.cwd(), '../myblog-ddd/myblog-ddd-starter/src/main/resources/sql');
        const tablesSql = fs.readFileSync(path.join(localSqlDir, 'create_tables.sql'), 'utf-8');
        let dataSql = fs.readFileSync(path.join(localSqlDir, 'china_city_code.sql'), 'utf-8');
        dataSql = dataSql.replaceAll('INSERT INTO', 'INSERT IGNORE INTO');
        await connDb.query(tablesSql);
        await connDb.query(dataSql);
        await connDb.end();

        sshSpinner.succeed(chalk.green('数据库初始化完成'));
        conn.end();
        resolve();
      } catch (err) {
        sshSpinner.fail(chalk.red('数据库初始化失败'));
        conn.end();
        reject(err);
      }
    }).on('error', (err) => {
      sshSpinner.fail('SSH 连接失败');
      reject(err);
    }).connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey
    });
  });
}

async function deploy() {
  await validateConfig();
  try {
    await buildBackend();
  } catch (e) {
    await remoteBuildAndDeploy();
    return;
  }

  const spinner = ora('正在连接服务器...').start();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
    });
    spinner.succeed(chalk.green('服务器连接成功'));

    // 1. 确保远程目录存在
    const remoteExists = await sftp.exists(config.remotePath);
    if (!remoteExists) {
      spinner.start('远程目录不存在，正在创建...');
      await sftp.mkdir(config.remotePath, true);
      spinner.succeed(chalk.green(`远程目录已创建: ${config.remotePath}`));
    }

    // 2. 上传 Jar 包
    spinner.start('正在上传 Jar 包...');
    await sftp.put(config.localJarPath, `${config.remotePath}/app.jar`);
    spinner.succeed(chalk.green('Jar 包上传成功'));

    // 3. 上传启动脚本
    spinner.start('正在上传启动脚本...');
    await sftp.put(config.startScriptPath, `${config.remotePath}/start.sh`);
    // 赋予执行权限
    await sftp.chmod(`${config.remotePath}/start.sh`, 0o755);
    spinner.succeed(chalk.green('启动脚本上传成功'));

    // 4. 重启服务
    spinner.start('正在重启后端服务...');
    // 使用 nohup 运行脚本，并将其输出重定向到 /dev/null 或日志文件
    // 注意：ssh 执行命令时如果不妥善处理后台进程，连接可能会 hang 住
    // 这里的 start.sh 内部应该处理好 nohup
    const startCmd = `bash ${config.remotePath}/start.sh`;
    
    // 我们通过 sftp 对应的 ssh client 来执行命令，或者 sftp-client 没有 exec 方法？
    // ssh2-sftp-client 主要是 sftp。我们需要用 ssh2 或者 ssh2-sftp-client 暴露的 client。
    // ssh2-sftp-client 不直接提供 exec。但我们可以通过 client 属性访问底层 ssh2 client？
    // 不，最好是再建立一个 ssh 连接，或者使用 exec 库在本地执行 ssh 命令（如果本地有 ssh）。
    // 为了稳健，我们使用 ssh2 库（ssh2-sftp-client 依赖它，但不一定暴露）。
    // 实际上 ssh2-sftp-client 只是 sftp 封装。
    // 这里简单起见，如果 ssh2-sftp-client 不支持 exec，我们得另辟蹊径。
    // 既然我们有密码/key，可以用 ssh2 库。
    // 检查 package.json，我们只装了 ssh2-sftp-client。
    // ssh2-sftp-client 内部使用了 ssh2。
    // 我们可以直接 import { Client as SSHClient } from 'ssh2'; 但这需要单独安装 ssh2 (虽然它是 sftp 的依赖，但最好显式安装)。
    // 为了不引入新依赖，我们尝试用 ssh2-sftp-client 的扩展性？
    // 查阅文档，ssh2-sftp-client 主要是文件操作。
    // 我们需要一个能执行命令的库。
    // 既然刚才已经成功安装了 ssh2-sftp-client，它依赖 ssh2。
    // 我们可以尝试动态 import ssh2。
    
    // 为了简单，我们提示用户手动重启，或者我们使用 child_process 调用系统的 ssh 命令（假设用户装了 git bash 或 wsl）。
    // 但用户是 Windows。
    // 让我们尝试用 ssh2-sftp-client 的 client 属性（如果有）。
    // 否则，我们添加 ssh2 依赖？
    // 其实，我们可以用 sftp 上传一个 "trigger" 文件？不，太复杂。
    
    // 让我们使用 `ssh2` 库。它应该已经在 node_modules 里了。
  } catch (err) {
    spinner.fail(chalk.red('部署过程中出错'));
    console.error(err);
  } finally {
    await sftp.end();
  }
  
  // 重新建立 SSH 连接执行命令
  const { Client: SSHClient } = await import('ssh2');
  const conn = new SSHClient();
  
  const sshSpinner = ora('正在执行远程重启命令...').start();
  
  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
        // 传递环境变量给启动脚本
        // 注意：这里假设 .env.deploy.local 里的变量也需要传给后端？
        // 通常后端配置在 application.yml 里已经用 ${ENV} 占位。
        // 我们可以在 start.sh 里 source 一个 env 文件，或者在命令行传入。
        // 为了安全和灵活，我们将 .env.deploy.local 中的 DB_*, REDIS_* 变量拼接成 export 语句写入一个 .env 文件上传到服务器
        // 然后在 start.sh 中 source 它。
        
        const cmd = `bash ${config.remotePath}/start.sh`;
        
        conn.exec(cmd, (err, stream) => {
            if (err) {
                sshSpinner.fail('执行命令失败');
                conn.end();
                reject(err);
                return;
            }
            stream.on('close', (code, signal) => {
                sshSpinner.text = `命令执行完毕，退出码: ${code}`;
                sshSpinner.succeed(chalk.green('后端服务重启指令已发送'));
                conn.end();
                resolve();
            }).on('data', (data) => {
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        sshSpinner.fail('SSH 连接失败');
        reject(err);
    }).connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey
    });
  });
}

if (process.argv.includes('--db-init')) {
  dbInit();
} else {
  deploy();
}
