
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
  startScriptPath: path.resolve(__dirname, 'start.sh'),
  // 环境变量文件路径
  localEnvPath: path.resolve(process.cwd(), '../myblog-ddd/.env')
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
    
    // 上传 .env 文件到远程目录
    if (fs.existsSync(config.localEnvPath)) {
      await sftp.put(config.localEnvPath, `${config.remotePath}/.env`);
    }

    // 上传启动脚本
    await sftp.put(config.startScriptPath, `${config.remotePath}/start.sh`);
    await sftp.chmod(`${config.remotePath}/start.sh`, 0o755);

    // 上传构建好的 JAR 包
    const localJarPath = path.resolve(process.cwd(), '../myblog-ddd/myblog-ddd-starter/target/myblog-ddd-starter-1.0-SNAPSHOT.jar');
    if (fs.existsSync(localJarPath)) {
      await sftp.put(localJarPath, `${config.remotePath}/app.jar`);
      spinner.succeed(chalk.green('后端源码、.env、启动脚本及 JAR 包已上传'));
    } else {
      spinner.succeed(chalk.green('后端源码、.env 及启动脚本已上传 (JAR 包未找到，将尝试远程构建)'));
    }
  } catch (e) {
    spinner.fail(chalk.red('上传源码失败'));
    throw e;
  } finally {
    await sftp.end();
  }

  const { Client: SSHClient } = await import('ssh2');
  const conn = new SSHClient();
  const sshSpinner = ora('正在处理远程部署...').start();
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
        // 检查 JAR 是否已上传
        const checkJar = `[ -f ${config.remotePath}/app.jar ] && echo "JAR_EXISTS" || echo "JAR_MISSING"`;
        let jarExists = false;
        await new Promise((res) => {
          conn.exec(checkJar, (err, stream) => {
            stream.on('data', (data) => {
              if (data.toString().includes('JAR_EXISTS')) jarExists = true;
            }).on('close', () => res());
          });
        });

        if (!jarExists) {
          sshSpinner.text = '未检测到 JAR 包，正在尝试远程 Maven 构建...';
          // 安装 Java 和 Maven（如果缺失）
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
                fi
              fi
            fi
          `;
          await execRemote(conn, installCmd);
          await execRemote(conn, buildCmd);
          await execRemote(conn, copyCmd);
          sshSpinner.succeed(chalk.green('远程构建并复制完成'));
        } else {
          sshSpinner.succeed(chalk.green('检测到已上传的 JAR 包，跳过远程构建'));
        }

        const stepSpinner = ora('正在启动服务...').start();
        await execRemote(conn, startCmd);
        stepSpinner.succeed(chalk.green('服务已启动'));
        conn.end();
        resolve();
      } catch (err) {
        sshSpinner.fail(chalk.red('远程部署或启动失败'));
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
  const envPath = path.resolve(process.cwd(), '../myblog-ddd/.env');
  const content = fs.readFileSync(ymlPath, 'utf-8');
  
  // 提取变量名
  const getVarName = (line) => {
    const m = line.match(/\$\{([^}]+)\}/);
    return m ? m[1] : null;
  };

  const urlLine = content.match(/url:\s*(.*)/);
  const userLine = content.match(/username:\s*(.*)/);
  const passLine = content.match(/password:\s*(.*)/);

  let url = urlLine ? urlLine[1].trim() : '';
  let username = userLine ? userLine[1].trim() : '';
  let password = passLine ? passLine[1].trim() : '';

  // 如果是环境变量占位符，从 .env 文件读取
  if (url.startsWith('${')) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const varName = getVarName(url);
    const envMatch = envContent.match(new RegExp(`${varName}=(.*)`));
    if (envMatch) url = envMatch[1].trim();
  }
  if (username.startsWith('${')) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const varName = getVarName(username);
    const envMatch = envContent.match(new RegExp(`${varName}=(.*)`));
    if (envMatch) username = envMatch[1].trim();
  }
  if (password.startsWith('${')) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const varName = getVarName(password);
    const envMatch = envContent.match(new RegExp(`${varName}=(.*)`));
    if (envMatch) password = envMatch[1].trim();
  }

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

    // 4. 上传 .env 文件
    if (fs.existsSync(config.localEnvPath)) {
      spinner.start('正在上传 .env 文件...');
      await sftp.put(config.localEnvPath, `${config.remotePath}/.env`);
      spinner.succeed(chalk.green('.env 文件上传成功'));
    } else {
      console.log(chalk.yellow('⚠️ 未找到 .env 文件，跳过上传'));
    }

    // 5. 重启服务
    spinner.start('正在重启后端服务...');
    
    // 我们在 finally 之后处理重启逻辑，所以这里先标记上传阶段完成
    spinner.succeed(chalk.green('所有部署文件上传成功'));
  } catch (err) {
    spinner.fail(chalk.red('部署过程中出错'));
    console.error(err);
  } finally {
    await sftp.end();
  }
  
  const { Client: SSHClient } = await import('ssh2');
  const conn = new SSHClient();
  
  const sshSpinner = ora('正在建立 SSH 连接执行重启指令...').start();
  
  return new Promise((resolve, reject) => {
    conn.on('ready', () => {
        sshSpinner.text = '正在执行远程重启脚本...';
        const cmd = `bash ${config.remotePath}/start.sh`;
        
        conn.exec(cmd, (err, stream) => {
            if (err) {
                sshSpinner.fail('执行重启命令失败');
                conn.end();
                reject(err);
                return;
            }
            stream.on('close', (code, signal) => {
                if (code === 0) {
                  sshSpinner.succeed(chalk.green('后端服务已成功启动'));
                } else {
                  sshSpinner.fail(chalk.red(`重启脚本执行失败，退出码: ${code}`));
                }
                conn.end();
                resolve();
            }).on('data', (data) => {
                const msg = data.toString().trim();
                if (msg) {
                  sshSpinner.text = `[远程输出] ${msg}`;
                  console.log(chalk.gray(`STDOUT: ${msg}`));
                }
            }).stderr.on('data', (data) => {
                console.log(chalk.yellow('STDERR: ' + data));
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
