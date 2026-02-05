
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Client from 'ssh2-sftp-client';
import ora from 'ora';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

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
  remotePath: process.env.DEPLOY_REMOTE_PATH || '/var/www/myblog',
  localPath: path.resolve(process.cwd(), 'dist'),
};

async function validateConfig() {
  if (!config.host || !config.username || (!config.password && !config.privateKey)) {
    console.log(chalk.red('❌ 错误: 请在 .env.deploy.local 文件中配置服务器连接信息 (Host, Username, Password/Key)'));
    process.exit(1);
  }
  if (!fs.existsSync(config.localPath)) {
    console.log(chalk.red('❌ 错误: 本地 dist 目录不存在，请先执行 pnpm build 进行打包'));
    process.exit(1);
  }
}

async function deploy() {
  await validateConfig();

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

    // 检查远程目录是否存在，不存在则创建
    const remoteExists = await sftp.exists(config.remotePath);
    if (!remoteExists) {
      spinner.start('远程目录不存在，正在创建...');
      await sftp.mkdir(config.remotePath, true);
      spinner.succeed(chalk.green(`远程目录已创建: ${config.remotePath}`));
    }

    // 清理远程目录（可选，视需求而定，这里默认覆盖）
    // spinner.start('清理远程目录...');
    // await sftp.rmdir(config.remotePath, true);
    // await sftp.mkdir(config.remotePath, true);

    spinner.start('正在上传文件...');
    
    sftp.on('upload', (info) => {
      spinner.text = `正在上传: ${info.source}`;
    });

    await sftp.uploadDir(config.localPath, config.remotePath);
    
    spinner.succeed(chalk.green('🎉 部署成功！所有文件已上传。'));
    console.log(chalk.blue(`\n访问地址提示: 请确保您的 Nginx 已配置指向 ${config.remotePath}`));
    
  } catch (err) {
    spinner.fail(chalk.red('部署失败'));
    console.error(err);
  } finally {
    await sftp.end();
  }
}

deploy();
