let fs = require('fs').promises;
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio');

const url = 'http://www.zhufengpeixun.cn/ahead/index.html';
const baseDir = path.resolve(__dirname);
const web = 'http://www.zhufengpeixun.cn'


// let [, dir, fileName] = dealUrl('http://www.zhufengpeixun.cn/ahead/static/css/main.css')
// mkdir('d:\\webStromProject\\201905jiagouke\\test', 'images\\n\\n.gif');
// mkdir('d:\\webStromProject\\201905jiagouke\\test', 'ahead\\html\\0.editor.html');

getAllLink().then(urls => {
    for (let url of urls.values()) {
        getA(url);
    }
}).catch(e => console.error(e))

async function getA(url) {
    //解析 下载
    
    let { css, js, img, links } = await getResourcePath(url);
    // console.log(css, js, img);

    img.forEach(imgSrc=>downloadFile(imgSrc))
    css.forEach(url => {
        downloadTextResource(url)
    })
    js.forEach(url => {
        downloadTextResource(url)
    })
    downloadTextFile(url);
    return links;

}


/**
 * get all links of web,
 */
async function getAllLink() {
    const urlQueue = [url]
    const allLink = new Set();
    const visitedSet = new Set();
    allLink.add(url);
    while (urlQueue.length > 0) {
        let url = urlQueue.pop();
        if (url.startsWith(web)) {
            const links = await getA(url);
            visitedSet.add(url);
            for (let link of links.values()) {
                if (!visitedSet.has(link)) {
                    allLink.add(link);
                    if (urlQueue.includes(link))
                        urlQueue.push(link);
                }
            }
        }
    }
    // console.log('found all link of pages',allLink);
    return new Promise((resolve, reject) => {
        resolve(allLink)
    });
}

/**
 * get all path of resource ,include html css js img 
 * @param {*} url 
 */






async function downloadTextResource(html) {
    const res = await axios.get(html);
    downloadTextFile(html, res.data);
}

async function getResourcePath(url) {
    const res = await axios.get(url);
    const htmlStr = res.data
    const $ = cheerio.load(htmlStr);
    let last = url.lastIndexOf('/');
    const baseDir = url.slice(0, last);

    let links = Array.from($('a')).map(i => i.attribs.href);
    links = links.filter(i => !i.includes('#'));
    // links = links.map(i => baseDir+'\\'+i)
    links = parse2absolutePath(links, baseDir, last);
    let css = Array.from($('link')).map(i => i.attribs.href);
    css = parse2absolutePath(css, baseDir, last);
    let js = Array.from($('script')).filter(i => i.attribs.src).map(i => i.attribs.src);
    js = parse2absolutePath(js, baseDir, last);
    let img = Array.from($('img')).filter(i => i.attribs.src).map(i => i.attribs.src);
    return { css, js, img, links };
}

function parse2absolutePath(links, baseDir, last) {
    links = links.map(i => {
        // console.log(i)   'http://7xjf2l.com1.z0.glb.clouddn.com/cache.png'
        if (i.startsWith('http://') || i.startsWith('https://')) {
            if (!i.startsWith(web)) {
                i = '';
            }
        }
        else if (/[a-zA-Z]/.test(i.slice(0, 1))) {
            i = baseDir + '/' + i;
        }
        else if (i.startsWith('..')) {
            last = baseDir.lastIndexOf('/');
            i = i.replace('..', baseDir.slice(0, last));
        } else if (i.startsWith('/')) {
            // console.log(baseDir);
            const end = baseDir.indexOf('/', 8);
            i = baseDir.slice(0, end) + i;
        }
        return encodeURI(i);
    });
    links = links.filter(i => i);
    return links;
}

/**
 * download resource
 * @param {'http://www.zhufengpeixun.cn/ahead/html/79.grammar.html'} url 
 */
async function downloadTextFile(url) {
    const res = await axios.get(url);
    const data = res.data
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    $('img').each((i, img) => {
        if (img.attribs.src)
            img.attribs.src = img.attribs.src.replace('http://img.zhufengpeixun.cn', '..');

    })
    data = $.html();
    let [, dir, fileName] = dealUrl(url);
    let absPath
    if (dir === "") {
        absPath = [baseDir, fileName].join('\\');
    } else {
        absPath = [baseDir, dir, fileName].join('\\');
    }
    absPath = decodeURI(absPath);
    await mkdir('d:\\webStromProject\\201905jiagouke\\test', dir);
    console.log('make file ', absPath);
    // if(fs.stat)
    const isExist = await fileExist(absPath);
    if (!isExist)
        fs.writeFile(absPath, data, { encoding: 'utf-8', flag: 'w' });
}

// downloadFile('http://img.zhufengpeixun.cn/asyncfunc1.png')
async function downloadFile(url) {
    
    var fs = require('fs');
    var request = require("request");
    let [, dir, fileName] = dealUrl(url);
     dir = dir + '\\ahead\\static\\img'
    let absPath
    if (dir === "") {
        absPath = [baseDir, fileName].join('\\');
    } else {
        absPath = [baseDir, dir, fileName].join('\\');
    }
    absPath = decodeURI(absPath);
    await mkdir(baseDir, dir);
    const isExist = await fileExist(absPath);

    if (!isExist) {
        console.log('make file img', absPath);
        var writeStream = fs.createWriteStream(absPath);
        var readStream = request(encodeURI(url))
        readStream.pipe(writeStream);
        writeStream.on("finish", function () {
            console.log("文件写入成功");
            writeStream.end();
        });

    }
}



// {/* <img src="http://img.zhufengpeixun.cn/asyncfunc1.png" alt=""></img> */}
// d:\webStromProject\201905jiagouke\test\static/img\tcpwindow.png

/**
 *   let  htmlStr= dealHtmlImg(res.data,'http://img.zhufengpeixun.cn','http://www.zhufengpeixun.cn/static/img')
 * @param {*} htmlStr 
 * @param {*} webPath 
 * @param {*} imgDir 
 */
function dealHtmlImg(htmlStr, webPath, imgDir) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(htmlStr);
    $('img').each((i, img) => {
        if (img.attribs.src)
            img.attribs.src = img.attribs.src.replace(webPath, imgDir);

    })
    return $.html();
}

/**
 * 处理 \a\b\c这种格式
 * @param {'\a\b'} url 
 */
function dealUrl(url) {
    if (url.includes('\\')) throw Error('url: 格式错误，不能包含\\，请改成\ ' + url)
    const start = url.slice(7).indexOf('/') + 7;
    const domain = url.slice(0, start);
    const endIndex = url.lastIndexOf('/');
    let dir = url.slice(start + 1, endIndex);
    // 'static/img'.replace(/[/]/i,'\\')
    dir = dir.replace(/[/]/g, '\\');
    const fileName = url.slice(endIndex + 1);
    // console.log(domain, dir, fileName);
    return [domain, dir, fileName];
}

/**
 * // 递归创建目录  这种形式 a/b/c
 * @param {'d:\webStromProject\201905jiagouke'} dir 
 * @param {'test\ahead'} path 
 */
async function mkdir(dir, path) {
    if (path.startsWith('\\')) path = path.slice(1);
    if (!path.includes('\\')) {
        const isExist = await fileExist(dir + '\\' + path);
        if (!isExist) {
            await fs.mkdir(dir + '\\' + path);
        }
    } else {
        let index = path.indexOf('\\');
        const p = path.slice(0, index);
        dir = dir + '\\' + p;
        const isExist = await fileExist(dir);
        if (!isExist) {
            await fs.mkdir(dir);
        }
        await mkdir(dir, path.slice(index + 1));
    }
    new Promise((resolve, reject) => {
        console.log(dir, path);
        resolve()
    });
}

function fileExist(path) {
    return new Promise((resolve, reject) => {
        require('fs').exists(path, (r) => {
            resolve(r);
        });
    });
}

