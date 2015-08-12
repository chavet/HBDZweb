var fs = require('fs');

// The module to be exported.
var file = module.exports = {};
var pathSeparatorRe = /[\/\\]/g;

// Like mkdir -p. Create a directory and any intermediary directories.
file.mkdir = function(dirpath, mode) {
  // Set directory mode in a strict-mode-friendly way.
  if (mode == null) {
    mode = parseInt('0777', 8) & (~process.umask());
  }
  dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
    parts += part + '/';
    // var subpath = path.resolve(parts);
    var subpath = parts;
    if (!file.exists(subpath)) {
      try {
        fs.mkdirSync(subpath, mode);
      } catch(e) {
        throw console.error('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
      }
    }
    return parts;
  }, '');
};

// The default file encoding to use.
file.defaultEncoding = 'utf8';
// Whether to preserve the BOM on file.read rather than strip it.
file.preserveBOM = false;

// Read a file, return its contents.
file.read = function(filepath) {
  var contents;
  try {
    contents = fs.readFileSync(String(filepath)).toString();
    console.log('Reading "' + filepath + '" successful');
    return contents;
  } catch(e) {
    console.error('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').');
  }
};

// Write a file.
file.write = function(filepath, contents) {
  // Create path, if necessary.
  // file.mkdir(path.dirname(filepath));
  file.mkdir(filepath);
  try {
    // If contents is already a Buffer, don't try to encode it. If no encoding
    // was specified, use the default.
    if(!Buffer.isBuffer(contents)){
      contents = new Buffer(contents);
    }
    // Actually write file.
    fs.write(filepath, contents, 'w');
    // console.log('Write "'+filepath+'" successful');
  } catch(e) {
    console.error('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').');
  }
};



// True if the file path exists.
file.exists = function(filepath) {
  return fs.existsSync(filepath);
};

