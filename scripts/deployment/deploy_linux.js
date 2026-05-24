const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '192.168.239.139',
    port: 22,
    username: 'root',
    password: '1111'
};

const remotePath = '/root/ee2x/ee2vnts';
const conn = new Client();

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function mkdir(sftp, dir) {
    return new Promise((resolve, reject) => {
        sftp.mkdir(dir, (err) => {
            if (err && err.code !== 4) reject(err);
            else resolve();
        });
    });
}

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('data', (data) => {
                output += data.toString();
                process.stdout.write(data.toString());
            });
            stream.stderr.on('data', (data) => {
                process.stderr.write(data.toString());
            });
            stream.on('close', (code) => {
                resolve({ code, output });
            });
        });
    });
}

async function deploy() {
    console.log('连接到服务器...');

    conn.on('ready', async () => {
        try {
            console.log('✓ SSH连接成功');

            // 创建目录
            console.log('\n创建部署目录...');
            await exec(conn, `mkdir -p ${remotePath}/static`);
            await exec(conn, `mkdir -p ${remotePath}/key`);
            await exec(conn, `mkdir -p ${remotePath}/log`);

            // 上传文件
            console.log('\n上传文件...');
            conn.sftp(async (err, sftp) => {
                if (err) throw err;

                try {
                    await uploadFile(sftp, 'web_server.py', `${remotePath}/web_server.py`);
                    console.log('✓ web_server.py');

                    await uploadFile(sftp, 'start.sh', `${remotePath}/start.sh`);
                    console.log('✓ start.sh');

                    await uploadFile(sftp, 'README_LINUX.md', `${remotePath}/README_LINUX.md`);
                    console.log('✓ README_LINUX.md');

                    await uploadFile(sftp, 'static/admin.html', `${remotePath}/static/admin.html`);
                    console.log('✓ static/admin.html');

                    // 上传static目录下的其他文件
                    const staticFiles = [
                        'static/index.html',
                        'static/login.html',
                        'static/favicon.ico'
                    ];

                    for (const file of staticFiles) {
                        if (fs.existsSync(file)) {
                            await uploadFile(sftp, file, `${remotePath}/${file}`);
                            console.log(`✓ ${file}`);
                        }
                    }

                    // 上传CSS和JS目录
                    await mkdir(sftp, `${remotePath}/static/css`);
                    await mkdir(sftp, `${remotePath}/static/js`);
                    await mkdir(sftp, `${remotePath}/static/html`);
                    await mkdir(sftp, `${remotePath}/static/svg`);

                    const cssFiles = fs.readdirSync('static/css');
                    for (const file of cssFiles) {
                        await uploadFile(sftp, `static/css/${file}`, `${remotePath}/static/css/${file}`);
                        console.log(`✓ static/css/${file}`);
                    }

                    const jsFiles = fs.readdirSync('static/js');
                    for (const file of jsFiles) {
                        await uploadFile(sftp, `static/js/${file}`, `${remotePath}/static/js/${file}`);
                        console.log(`✓ static/js/${file}`);
                    }

                    const htmlFiles = fs.readdirSync('static/html');
                    for (const file of htmlFiles) {
                        await uploadFile(sftp, `static/html/${file}`, `${remotePath}/static/html/${file}`);
                        console.log(`✓ static/html/${file}`);
                    }

                    const svgFiles = fs.readdirSync('static/svg');
                    for (const file of svgFiles) {
                        await uploadFile(sftp, `static/svg/${file}`, `${remotePath}/static/svg/${file}`);
                        console.log(`✓ static/svg/${file}`);
                    }

                    sftp.end();

                    // 设置权限
                    console.log('\n设置权限...');
                    await exec(conn, `chmod +x ${remotePath}/start.sh`);
                    console.log('✓ start.sh 可执行');

                    // 下载vnts
                    console.log('\n下载vnts...');
                    const downloadResult = await exec(conn, `cd ${remotePath} && wget -q https://github.com/lbl8603/vnt/releases/download/1.2.12/vnts-linux-x86_64 -O vnts && chmod +x vnts`);
                    if (downloadResult.code === 0) {
                        console.log('✓ vnts下载成功');
                    } else {
                        console.log('⚠ vnts下载失败，请手动上传');
                    }

                    // 安装依赖
                    console.log('\n安装Python依赖...');
                    await exec(conn, `cd ${remotePath} && pip3 install flask requests`);

                    // 启动服务
                    console.log('\n启动服务...');
                    await exec(conn, `cd ${remotePath} && nohup python3 web_server.py --port 8888 > web.log 2>&1 &`);

                    // 等待服务启动
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 检查服务状态
                    console.log('\n检查服务状态...');
                    const statusResult = await exec(conn, `ps aux | grep "web_server.py" | grep -v grep`);
                    if (statusResult.output.includes('web_server.py')) {
                        console.log('✓ 服务已启动');
                        console.log('\n访问地址: http://192.168.239.139:8888/admin.html');
                        console.log('默认账号: admin');
                        console.log('默认密码: password');
                    } else {
                        console.log('✗ 服务启动失败');
                        console.log('\n查看日志:');
                        await exec(conn, `cd ${remotePath} && tail -20 web.log`);
                    }

                    conn.end();
                } catch (error) {
                    console.error('部署失败:', error);
                    conn.end();
                }
            });
        } catch (error) {
            console.error('执行失败:', error);
            conn.end();
        }
    });

    conn.on('error', (err) => {
        console.error('SSH连接错误:', err);
    });

    conn.connect(config);
}

deploy();
