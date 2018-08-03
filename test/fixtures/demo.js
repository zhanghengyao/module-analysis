exports.convert = function convert(str){ 
  str = str.replace(/(\\u)(\w{1,4})/gi, (unicode) => { 
      return (String.fromCharCode(parseInt((escape(unicode).replace(/(%5Cu)(\w{1,4})/g,"$2")),16))); 
  });
  return str; 
}