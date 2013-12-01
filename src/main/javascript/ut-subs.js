/*global require, console, process */


//TODO - testowalność komponentów


(function(args, fs, console){
    'use strict';
    var APP_NAME = 'ut-subs.js v1.0.2-SNAPSHOT';

     /*
     Time format:
         1:01
         10:01
         127:01

     Lines:
         ###
         <text>
         ###                   //mulit
         ###
         <text>

     Chcemy:
        02:03:03:<tekst>
      */

    function nextLineGetter(data) {
        var last = 0,
            L = data.length;

        return function() {
            var next = data.indexOf('\n', last),
                line;

            if( next === -1) {
                if( last < L) {
                    next = L;
                } else {
                    return null;
                }
            }
            line = data.slice(last, next);
            last = next + 1;
            return line;
        };
    }

    function UtTime(minPart, secPart) {
        if( !(this instanceof UtTime)) {
            throw new Error('[UtTime] is constructor, should be called with new');
        }
        this.minutes = parseInt(minPart);
        this.seconds = parseInt(secPart);
    }

    UtTime.prototype.isGreaterThanOrEqualTo = function(other) {
        if( this.minutes > other.minutes ) { return true; }
        if( this.seconds >= other.seconds ) { return true; }
        return false;
    };


    function getConvertedLine(time, text) {
        var h = Math.floor(time.minutes / 60),
            m = time.minutes - h*60,
            s = time.seconds;

        function getStrElem(elem) {
            return (elem < 10 ? '0' : '') + elem;
        }
        return getStrElem(h) + ':' + getStrElem(m) + ':' + getStrElem(s) + ':' + text + '\n';
    }


    function convert(data){

        var timeRgx = /^\s*(\d+):(\d{2})/,
            nextLine,
            line,
            lastTime = null,
            newTime = null,
            lineNo = 0,
            match,
            dataOut = '';

        data = data.replace(/\r/g,'');   //get rid of \r, jak dałem '\r' to nie zadziałało. js nie uznaje?
        nextLine = nextLineGetter(data);

        while((line = nextLine()) !== null) {
            lineNo += 1;
            match = timeRgx.exec(line);

            if( !!match) {
                newTime = new UtTime(match[1], match[2]);
                if( !!lastTime && !newTime.isGreaterThanOrEqualTo(lastTime)) {
                    throw new Error('Time is not in order, line: ' + lineNo);
                }
                lastTime = newTime;  //jak powtórzony czas to po prostu pomijamy
            } else {
                //linia z tekstem?
                if( !lastTime ) {
                    throw new Error('Line with text was not preceded by line with time, line:' + lineNo);
                }
                dataOut += getConvertedLine(lastTime, line);
                lastTime = null;
            }
        }
        return dataOut;
    }

    function saveFile(options, dataOut) {
        fs.writeFile(options.path + '.ut-subs', dataOut, { encoding: options.outEnc}, function(err){
            if(err) { throw err; }
        });
    }

    function convertFile(options) {
        fs.readFile( options.path, { encoding: options.inEnc}, function(err, data){
            if(err) { throw err; }
            var dataOut = convert(data);
            saveFile(options, dataOut);
        });
    }


    function main(args) {
        if(args.length < 3) {
            console.log('usage:');
            console.log('node ut-subs.js <file-to-conver> [in-encoding] [out-encoding]');
            console.log('node ut-subs.js -version');
            return;
        }
		if( args[2] === '-version' ) {
			console.log(APP_NAME);
			return;
		}		
        convertFile({
            path : args[2],
            inEnc: !!args[3] ? args[3] : 'utf-8',
            outEnc: !!args[4] ? args[3] : 'utf-8'
        });
    }

    main(args);

})(process.argv, require('fs'), console);


