var fs = require('fs'),
    util = require('util'),
    request = require('request'),
    logger = require( 'pelias-logger' ).get( 'geonames' );

// use datapath setting from your config file
var settings = require('pelias-config').generate();
var basepath = settings.imports.geonames.datapath;

module.exports.selectSource = function(filename) {
  var localFileName = util.format( '%s/%s.zip', basepath, filename );
  var remoteFilePath = util.format( 'http://download.geonames.org/export/dump/%s.zip', filename );

  if( fs.existsSync( localFileName ) ){
    logger.info( 'reading datafile from disk at:', localFileName );
    return fs.createReadStream( localFileName);
  } else {
    logger.info( 'streaming datafile from:', remoteFilePath );
    return request.get( remoteFilePath );
  }
};
