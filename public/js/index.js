const domainFile = 'http://localhost:3005';
const domainSocketServer = 'http://localhost:4000';
const socketdomainFile = io.connect(domainFile);

// const urlParams = new URLSearchParams(window.location.search);
// const clientId = urlParams.get('ID');
// console.log('ClientId từ cửa sổ chính là:', clientId);

var zTree;
var zNodes;
var setting = {
    data: {
        simpleData: {
            enable: true
        }
    },
    callback: {
        onClick: onTreeNodeClick
    }
};

let todaycurrentVỉewGetInfo = new Date();
let currentViewGetInfo = {
    year: todaycurrentVỉewGetInfo.getFullYear(),
    month: todaycurrentVỉewGetInfo.getMonth() + 1,
    day: todaycurrentVỉewGetInfo.getDate(),
    pageNumber:'1'  
};
let chooseDateForSearch = null;
let imageDataInfo = null;


function getNodeList() {
    //lấy từ api /nodeList
    $.get(`${domainFile}/nodeList`, function (data) {
        zNodes = data;
        console.log(data); // In dữ liệu lên console để kiểm tra
        $.fn.zTree.init($("#treeDemo"), setting, zNodes);
    });
}

function uploadFiles() {
    const input = document.getElementById('fileimage');
    const formData = new FormData();

    for (let i = 0; i < input.files.length; i++) {
        formData.append('file', input.files[i]);
    }

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.error('Lỗi:', error));
    initPageData();
}


function loadDataImages(dataSourceUrlImages) {
    $('#pagination-container').pagination({
        dataSource: `${dataSourceUrlImages}`,
        pageSize: 10,
        locator: 'images',
        autoHidePrevious: true,
        autoHideNext: true,
        totalNumberLocator: function (res) {
            return res.total;
        },
        afterPageOnClick: function (event, pageNumber) {
            var fomatDate = dataSourceUrlImages.split('/').slice(-3).join('/');
            loadDataPage(pageNumber, dataSourceUrlImages, fomatDate);
        },
        afterPreviousOnClick: function (event, pageNumber) {
            var fomatDate = dataSourceUrlImages.split('/').slice(-3).join('/');
            loadDataPage(pageNumber, dataSourceUrlImages, fomatDate);
        },
        afterNextOnClick: function (event, pageNumber) {
            var fomatDate = dataSourceUrlImages.split('/').slice(-3).join('/');
            loadDataPage(pageNumber, dataSourceUrlImages, fomatDate);
        }
    });
};

function loadDataPage(page, dataSourceUrlImages, formattedDate) {
    $.get(`${dataSourceUrlImages}?page=${page}`, function (data) {
        let imagesContainer = $('#images-container');
        imagesContainer.empty();
        for (let i = 0; i < data.images.length; i++) {
            const image = data.images[i];
            imagesContainer.append(`<div class="file-box" id="image-box">
                <div class="img-thumbnail-container">
        <img src="${domainFile}/get-image/${formattedDate}/${image}" alt="${image}" onclick="getImageToClient(event)" id="/get-image/${formattedDate}/${image}" class="img-thumbnail">
        <div class="image-thumbnail">${image}</div>
        </div>
                
            </div>`);
        }
        checkFlag();
    });
}

function onTreeNodeClick(event, treeId, treeNode) {
    let path = treeNode.getPath();
    let formattedPath = path.map(node => node.name).join('/');
    // loadDataImages('/'+formattedPath);
    dataSourceUrlImages = '/'+formattedPath;
    var fomatDate = dataSourceUrlImages.split('/').slice(-3).join('/');
    loadDataImages(domainFile + dataSourceUrlImages);
    loadDataPage(1,domainFile + dataSourceUrlImages, fomatDate);
    chooseDateForSearch = formattedPath;
    console.log('ngày chọn '+formattedPath);
    console.log(path);
}

function initPageData(){
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let formattedDate = `${year}/${month}/${day}`;
    let dataSourceUrl = `${domainFile}/images/${formattedDate}`;
    getNodeList();
    loadDataImages(dataSourceUrl);
    loadDataPage(1,dataSourceUrl,formattedDate);
};

function loadTotalImages(data) {
    if (data && data.total) {
        $('#count-images').text('Tổng số: ' + data.total);
    } else {
        console.error('Data không hợp lệ');
    }
}
initPageData();



function loadDataSearchImages(dataSourceUrlImages, searchName) {
    $('#pagination-container').pagination({
        dataSource: `${dataSourceUrlImages}?name=${searchName}`,
        pageSize: 10,
        locator: 'images',
        autoHidePrevious: true,
        autoHideNext: true,
        totalNumberLocator: function (res) {
            return res.total;
        },
    });
};
function loadDataSearchPage(page, dataSourceUrlImages, formattedDate, searchName) {
    $.get(`${dataSourceUrlImages}?page=${page}&name=${searchName}`, function (data) {
        let imagesContainer = $('#images-container');
        imagesContainer.empty();
        for (let i = 0; i < data.images.length; i++) {
            const image = data.images[i];
            imagesContainer.append(`<div class="file-box" id="image-box">
                <div class="img-thumbnail-container">
        <img src="${domainFile}/get-image/${formattedDate}/${image}" alt="${image}" onclick="getImageToClient(event)" id="/get-image/${formattedDate}/${image}" class="img-thumbnail">
        <div class="image-thumbnail">${image}</div>
    </div>
            </div>`);
        }
    });
}

function checkFlag() {
    var imgsSubmitButton = document.getElementById('images-count');
    var imgContainers = document.querySelectorAll('.file-box');
    // console.log(imgContainers);
    // var button = document.createElement("button");
    // button.classList.add('btn');    
    // button.classList.add('btn-primary');
    // button.innerHTML = "Tải lên các ảnh đã chọn";
    // imgsSubmitButton.appendChild(button);
    imgContainers.forEach(container => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('checkbox-overlay');
        checkbox.classList.add('form-check-input');
        checkbox.setAttribute('onclick', 'updateImageArray(event)');
        container.appendChild(checkbox);
        console.log("ok");
    });
}

$('#btn-search').on('click', function() {
    loadImagesSearch(chooseDateForSearch)
});
$('#search').on('keyup', function(e) {
    if (e.keyCode === 13) {
        loadImagesSearch(chooseDateForSearch)
    }
});
function loadImagesSearch(date) {
    let imageName = $('#search').val();
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let dataSourceUrl = `${domainFile}/search/${year}/${month}/${day}`;
    if(date != null || date != undefined || date != ''){
        dataSourceUrl = `${domainFile}/search/${year}/${month}/${day}`;
    }
    loadDataSearchImages(dataSourceUrl, imageName);
    loadDataSearchPage(1,dataSourceUrl,`${year}/${month}/${day}`,imageName);
}

function getImageToClient(event) {
    let imgSrc = event.target.src;
    console.log(imgSrc);
    socketdomainFile.emit('get-image-to-primary-from-file-server', imgSrc);

}
let selectedImages = [];

function updateImageArray(event) {
    const checkbox = event.target;
    const imgSrc = checkbox.parentNode.querySelector('.img-thumbnail').src;

    if (checkbox.checked) {
        if (!selectedImages.includes(imgSrc)) {
            selectedImages.push(imgSrc);
        }
    } else {
        const index = selectedImages.indexOf(imgSrc);
        if (index > -1) {
            selectedImages.splice(index, 1);
        }
    }

    console.log(selectedImages);
}