const fs = require('fs');
/**
 * 加载文件
 * @param {string} filePath 文件路径
 * @return {Promise}
 */
exports.loadFile = function loadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}