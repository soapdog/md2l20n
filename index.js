#! /usr/bin/env node

var marked = require("marked");
var renderer = new marked.Renderer();
var uuid = require("uuid");
var cli = require('cli').enable("version", "status");
var fs = require("fs");
var path = require("path");


renderer.paragraph = function(text) {
    return "<p data-l10n-id=\"fragment-"+ uuid.v4() +"\">" + text + "<p>";
}

renderer.blockquote = function(text) {
    return "<blockquote data-l10n-id=\"fragment-"+ uuid.v4() +"\">" + text + "<blockquote>";
}

renderer.heading = function (text, level) {

  return '<h' + level + " data-l10n-id=\"fragment-"+ uuid.v4() +"\">" +
                  text + '</h' + level + '>';
};


function processMarkdownFileToHTML(options) {
    var outputFilename = options.file.replace(path.extname(options.file), ".html");
        
    cli.info("Reading " + options.file);
    
    var fileContent = fs.readFileSync(options.file,"utf8");
    
    cli.info("Converting to HTML");
    
    var convertedContent = marked(fileContent, { renderer: renderer });
    
    cli.info("Saving HTML to " + outputFilename);
    
    fs.writeFileSync(outputFilename, convertedContent, "utf8");
}

cli.parse({
    file: ["f", "The file to process", "file", false],
    keysfile: ["k", "Enables generation of L20N syntax file", "true", true]
});

cli.main(function(args, options){
    if (!options.file) {
        cli.error("No input file!");
        return false;
    }
    
    
    processMarkdownFileToHTML();

    cli.info("Remember to manually check the file for missing nodes.");
    cli.ok("All done!");
});