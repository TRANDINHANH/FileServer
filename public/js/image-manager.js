const socket = io.connect('https://localhost:3005');
const socketServer = io.connect('https://localhost:4000');

let clientId = null;
socketServer.on('connect', () => {
    // Lấy socket.id của client
    clientId = socketServer.id;
    console.log('socketServer của client là:', clientId);
    socketServer.emit('primary-clientId-from-cms', clientId);
    // socket.emit('primary-clientId', clientId);
});

$('#button-open-image-manager').click(function (event) { 
    event.preventDefault();
    openImageManager();
});
let imageManagerWindow = null;

function openImageManager() {
    let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,
    width=1200,height=800,left=100,top=100`;
    
    imageManagerWindow = open(`https://localhost:3005`, 'test', params);  
}

socketServer.on('get-image-to-primary', (data) => {
    console.log(data);
    $('#image-preview').attr('src', data);

    // Đóng cửa sổ sau khi nhận được sự kiện
    if (imageManagerWindow) {
        setTimeout(() => {
            imageManagerWindow.close();
        }, 0);
    }       
});