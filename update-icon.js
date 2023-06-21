const fs = require('fs');
const https = require('https');
const path = require('path');
const querystring = require('querystring')

const iconfontConfig = {
  host: 'at.alicdn.com',
  // icon动态路径
  path: '',
  edrTargetFilePath: path.join(__dirname, '路径1/iconfont.js'),
  secTargetFilePath: path.join(__dirname, '路径2/iconfont.js'),
  // 临时文件路径
  tempFilePath: path.join(__dirname, './iconfont_tmp.js')
};

// 请求最新的下载地址
const getIconUrl = () => {
  const postData = querystring.stringify({
    pid: '*****', 
    t: Date.now(),
    ctoken: '*******'
  })
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': '*********'
    }
  }
  const req = https.request('https://www.iconfont.cn/api/project/cdn.json', options, res => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      // console.log('返回数据：', JSON.parse(data));
      const result= JSON.parse(data)
      if (result.code === 200) {
        iconfontConfig.path = '/t/' + result.data?.js_file + '.js';
        console.log(iconfontConfig.path, '更新地址')
        downloadIconfont()
      }
    });
  })
  req.on('error', (error) => {
    console.error('请求发生错误：', error);
  });
  // 将请求体数据放入请求中
  req.write(postData);
  req.end();
}

// 下载文件
const downloadIconfont = () => {
  cleanupDownloadedFile()
  const fileStream = fs.createWriteStream(iconfontConfig.tempFilePath);
  const options = {
    host: iconfontConfig.host,
    path: iconfontConfig.path
  };
  https.get(options, (response) => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Iconfont.js 下载完成');
      replaceIconfont();
    });
  }).on('error', (err) => {
    console.error('Iconfont.js 下载失败:', err);
  });
};

// 清除临时文件
const cleanupDownloadedFile = () => {
  if (!fs.existsSync(iconfontConfig.tempFilePath)) return
  fs.unlink(iconfontConfig.tempFilePath, (err) => {
    if (err) {
      console.error('删除临时文件失败:', err);
    } else {
      console.log('删除临时文件成功');
    }
  });
};

// 替换图标
const replaceIconfont = () => {
  // 替换onesec
  fs.copyFile(iconfontConfig.tempFilePath, iconfontConfig.secTargetFilePath, (err) => {
    if (err) {
      console.error('替换onesec图标库失败:', err);
    }
    console.log('替换onesec图标库成功');
  });
  // 替换pcedr
  fs.copyFile(iconfontConfig.tempFilePath, iconfontConfig.edrTargetFilePath, (err) => {
    if (err) {
      console.error('替换pcedr图标库失败:', err);
      cleanupDownloadedFile();
      return
    } else {
      console.log('替换pcedr图标库成功');
      cleanupDownloadedFile();
    }
  });
};

getIconUrl()
