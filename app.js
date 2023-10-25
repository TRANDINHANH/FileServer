var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
var SocketIOFile = require('socket.io-file');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const multer = require('multer');

const port = 3005;

const socketIO = require('socket.io-client');
const socketServer = socketIO.connect('http://localhost:4000');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'file_uploads/images/' + (new Date()).getFullYear() + '/' + ((new Date()).getMonth() + 1) + '/' + (new Date()).getDate());
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

let treeStructure = getDirectoryStructure('./file_uploads/images', 'images');
let nodeList = null;
let currentDay = new Date().getDate();


function getDirectoryStructure(dirPath, nodeName) {
    let structure = { name: nodeName, open: true, children: [] };
    let files = fs.readdirSync(dirPath);

    // Lấy ngày hiện tại
    let today = new Date();
    let dirName = `file_uploads\\images`;
    let formattedTodaydir = `${dirName}\\${today.getFullYear()}\\${today.getMonth() + 1}\\${today.getDate()}`;
    let formattedYearNowdir = `${dirName}\\${today.getFullYear()}`;
    let formattedYearAndMonthNowdir = `${dirName}\\${today.getFullYear()}\\${today.getMonth() + 1}`;
    let link = `images/${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`

    files.forEach(file => {
        let fullPath = path.join(dirPath, file);
        let stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            let childStructure = getDirectoryStructure(fullPath, file);

            // Kiểm tra xem ngày hiện tại có trùng với ngày trong đường dẫn không
            if (fullPath.localeCompare(formattedTodaydir) == 0 || fullPath.localeCompare(formattedYearNowdir) == 0 || fullPath.localeCompare(formattedYearAndMonthNowdir) == 0 || fullPath.localeCompare(dirName) == 0) {
                childStructure.open = true;
            }

            structure.children.push(childStructure);
        }
    });

    return structure;
}


function saveTreeStructure() {
    fs.writeFile('./file_uploads/tree_node_list.json', JSON.stringify(treeStructure), 'utf8', (err) => {
        if (err) {
            console.error('Lỗi khi ghi tệp JSON:', err);
        }
    });
}
const filePathTreeNode = './file_uploads/tree_node_list.json';




setInterval(() => {
    const now = new Date();
    if (now.getDate() !== currentDay) {
        currentDay = now.getDate();
        let dir = path.join('file_uploads', 'images', String(new Date().getFullYear()), String(new Date().getMonth() + 1), String(new Date().getDate()));

        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            console.log("Thư mục đã được tạo thành công!");
        });
        saveTreeStructure();
    }
}, 1000);

fs.readFile(filePathTreeNode, 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc tệp JSON:', err);
        return;
    }

    try {
        nodeList = JSON.parse(data);
    } catch (parseError) {
        console.error('Lỗi khi phân tích tệp JSON:', parseError);
    }
});


app.use(cors());
app.use(express.static('node_modules'));
app.use(express.static('zTree_v3-master'));
app.use(express.static('public'));
app.use('/get-image', express.static('file_uploads/images'));

app.get('/', (req, res) => {
    saveTreeStructure();
    res.sendFile(__dirname + '/public/views/index.html');
});
app.get('/nodeList', (req, res) => {
    saveTreeStructure();
    res.json(nodeList);
});

// API tải nhiều tệp lên
app.post('/upload', upload.array('file', 10), (req, res) => {
    if (!req.files) {
        return res.status(400).send('Không tìm thấy tệp để tải lên');
    }

    res.status(200).send('Tất cả các tệp đã được tải lên thành công');
});

app.get('/images/:year/:month/:day', (req, res) => {
    let dirPath = path.join('./file_uploads/images', req.params.year, req.params.month, req.params.day);
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            res.status(500).send('Lỗi khi đọc thư mục');
            return;
        }

        // Lọc ra các file ảnh
        let imageFiles = files.filter(file => {
            let fullPath = path.join(dirPath, file);
            let stats = fs.statSync(fullPath);
            return !stats.isDirectory() && ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase());
        });

        // Phân trang
        let page = parseInt(req.query.page) || 1;
        let pageSize = 10;
        let paginatedFiles = imageFiles.slice((page - 1) * pageSize, page * pageSize);

        res.json({
            total: imageFiles.length,
            images: paginatedFiles
        });
    });
});

app.get('/search/:year/:month/:day', (req, res) => {
    let imageName = req.query.name.toLowerCase();
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let pageSize = 10;
    let dirPath = path.join('./file_uploads/images', req.params.year, req.params.month, req.params.day);

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            res.status(500).send('Lỗi khi đọc thư mục');
            return;
        }

        // let matchingFiles = files.filter(file => file.includes(imageName)); // Tìm kiếm có phân biệt chữ hoa chữ thường
        let matchingFiles = files.filter(file => file.toLowerCase().includes(imageName));// Tìm kiếm không phân biệt chữ hoa chữ thường
        let paginatedFiles = matchingFiles.slice((page - 1) * pageSize, page * pageSize);

        res.json({
            total: matchingFiles.length,
            images: paginatedFiles
        });
    });
});

function GetImages(year, month, day, pageNumber, callback) {
    let dirPath = path.join('./file_uploads/images', year, month, day);
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            // Gọi callback với lỗi nếu có lỗi
            callback(err, null);
            return;
        }

        // Lọc ra các file ảnh
        let imageFiles = files.filter(file => {
            let fullPath = path.join(dirPath, file);
            let stats = fs.statSync(fullPath);
            return !stats.isDirectory() && ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase());
        });

        // Phân trang
        let page = parseInt(pageNumber) || 1;
        let pageSize = 10;
        let paginatedFiles = imageFiles.slice((page - 1) * pageSize, page * pageSize);

        // Gọi callback với kết quả
        callback(null, {
            total: imageFiles.length,
            images: paginatedFiles
        });
    });
}
// Xử lý tải lên
io.on('connection', (socket) => {
    console.log('Socket connected server. ' + socket.id);

    socket.on('primary-clientId', (cmsdata) => {
        console.log('primary-clientId: ' + JSON.stringify(cmsdata.id));

        socketServer.emit('primary-clientId-from-file-server', cmsdata);
    });
    socket.on('get-image-to-primary-from-file-server', (data) => {
        console.log(data);
        socketServer.emit('get-image-to-primary-from-file-server', data);
    }); 
})


server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
