const fs = require('fs');

const deleteFile = (filepath) => {
    console.log(filepath);
    fs.unlink(filepath, (err) => {
        if(err) console.log(err);
    });
};

exports.deleteFile = deleteFile;