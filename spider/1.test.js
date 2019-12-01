const axios = require('axios')
const fs = require('fs').promises

function dealHtmlImg(htmlStr, webPath, imgDir) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(htmlStr);
    $('img').each((i, img) => {
        img.attribs.src = img.attribs.src.replace(webPath, imgDir);

    })
    return $.html();
}

for (let index = 0; index < 3; index++) {
    downloadFile('http://img.zhufengpeixun.cn/asyncfunc1.png',index+'.png')
    
}

function downloadFile(url,fileName) {
    var fs = require('fs');
    var request = require("request");
    var writeStream = fs.createWriteStream(fileName);
    var readStream = request(url)
    readStream.pipe(writeStream);
}


// readStream.on('end', function () {
//     console.log('文件下载成功');
// });
// readStream.on('error', function () {
//     console.log("错误信息:" + err)
// })
// writeStream.on("finish", function () {
//     console.log("文件写入成功");
//     writeStream.end();
// });