#! /usr/bin/env node

var app = require('./package.json');
var cheerio = require("cheerio");
var marked = require("marked");
var renderer = new marked.Renderer();
var uuid = require("uuid");
var cli = require('cli').enable("version", "status");
var fs = require("fs");
var path = require("path");

/**
 * Renderer setup
 * 
 * We override the default markdown renderer to add the "data-l10n-id" attributes
 * to paragraphs, headings and blockquotes.
 * 
 * Due to the lack of a better key generation system we opted for UUID v4 with prefix.
 * looks ugly but works.
 */

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

/**
 * Processing the markdown input file and generating the needed output files
 */

function processMarkdownFileToHTML(options) {
    var outputFilename = options.file.replace(path.extname(options.file), ".html");
        
    cli.info("Reading " + options.file + "...");
    
    var fileContent = fs.readFileSync(options.file,"utf8");
    
    cli.info("Converting to HTML...");
    
    var convertedContent = marked(fileContent, { renderer: renderer });
    
    cli.info("Saving HTML to " + outputFilename+ "...");
    
    fs.writeFileSync(outputFilename, convertedContent, "utf8");
    
    return convertedContent;
}

function generateL20Nkeys(options, convertedContent) {
    var outputFilename = options.file.replace(path.extname(options.file), "." + options.locale + ".l20n");
    var $ = cheerio.load(convertedContent);
    var keys = [];
    
    $('[data-l10n-id]').each(function(i, elem) {
        keys.push({
            key:$(this).attr("data-l10n-id"),
            content: $(this).html()
        });
    });
    
    var outputKeysContent = "";
    
    for(var i=0, len = keys.length; i<len;i++) {
        outputKeysContent += "<" + keys[i].key + ' """\n' + keys[i].content + '\n""">\n\n';
    }
    
    cli.info("Saving L20N to " + outputFilename+ "...");
    
    fs.writeFileSync(outputFilename, outputKeysContent, "utf8");
    
}


/**
 * CLI Related cycle
 */

cli.setApp(app.name, app.version);

cli.parse({
    file: ["f", "The file to process", "file", false],
    locale: ["l", "Generated L20N syntax file for a given locale", "string", "en"]
});

cli.main(function(args, options){
    if (!options.file) {
        cli.error("No input file!");
        return false;
    }
    
    
    var convertedContent = processMarkdownFileToHTML(options);
    
    if (options.locale) {
        generateL20Nkeys(options, convertedContent);
    }

    cli.info("Remember to manually check the file for missing nodes.");
    cli.ok("All done!");
});