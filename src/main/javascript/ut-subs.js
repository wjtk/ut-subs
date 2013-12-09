/*global require, console, process, exports, module */

/*
 Time format:
     1:01
     10:01
     127:01


 Lines(### - time-lines):
     ###
     <text>
     ###
     ###
     <text>

 Wanted:
     02:03:03:<text>
 */

(function(process, fs, console, exports, module){
    'use strict';
    var APP_NAME = 'ut-subs.js v1.2.0-SNAPSHOT';

    //--------------------------------------------------------------------

    //The Function: no-deps
    function nextLineGetter()  {
        return function(data) {
            var last = 0,
                L;

            data = data.replace(/\r/g,'');   //get rid of \r
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
        };
    }

    //--------------------------------------------------------------------

    //The Function: no-deps, data-object-constructor
    function utTime() {
        function UtTime(minPart, secPart) {
            if( !(this instanceof UtTime)) {
                throw new Error('[UtTime] is constructor, should be called with new');
            }
            this.minutes = parseInt(minPart, 10);
            this.seconds = parseInt(secPart, 10);
        }

        UtTime.prototype.isGreaterThanOrEqualTo = function(other) {
            if( this.minutes > other.minutes ) { return true; }
            return (this.minutes === other.minutes) && (this.seconds >= other.seconds);
        };

        return UtTime;
    }

    //--------------------------------------------------------------------

    //The Object: no deps
    function tmplayerFormatter() {
        var out = '';

        function getStrElem(elem) {
            return (elem < 10 ? '0' : '') + elem;
        }

        function nextLine(time, text) {
            var h = Math.floor(time.minutes / 60),
                m = time.minutes - h*60,
                s = time.seconds;
            out += getStrElem(h) + ':' + getStrElem(m) + ':' + getStrElem(s) + ':' + text + '\n';
        }

        return {
            nextLine : nextLine,
            getDataOut :function() { return out; }
        };
    }

    //--------------------------------------------------------------------

    //The Function:
    function dataConverter(nextLineGetter, UtTime, formatter) {

        function rightTrim(str) {
            return str.replace(/\s*$/,'');
        }

        function checkTimeOrder(prevTime, nowTime, lineNo) {
            if( !!prevTime && !nowTime.isGreaterThanOrEqualTo(prevTime)) {
                throw new Error('Time is not in order, line no: ' + lineNo);
            }
        }

        return function(data){
            var timeRgx = /^\s*(\d+):(\d{2})/,
                nextLine,
                line,
                lastTime = null,    //lastTime in accepted time-line, text-line pair
                currentTime = null, //currentTime for next text-line
                newTime = null,     //currently read time
                lineNo = 0,
                match;


            nextLine = nextLineGetter(data);

            while((line = nextLine()) !== null) {
                lineNo += 1;
                match = timeRgx.exec(line);

                if( !!match) {
                    newTime = new UtTime(match[1], match[2]);
                    checkTimeOrder(currentTime, newTime, lineNo);
                    currentTime = newTime;  //if two lines with time we simply forget previous, without text
                } else {
                    if((line = rightTrim(line))!=='') {  //if empty line, we just ignore it
                        //linia z tekstem?
                        if( !currentTime ) {
                            throw new Error('Text-line was not preceded by time-line, line no: ' + lineNo);
                        }
                        checkTimeOrder(lastTime, currentTime, lineNo);
                        formatter.nextLine(currentTime, line);
                        lastTime = currentTime;
                        currentTime = null;
                    }
                }
            }
            return formatter.getDataOut();
        };
    }

    //--------------------------------------------------------------------

    //The Function:
	function fileConverter( fs, convertData, exceptionHandler ) {
        function saveFile(options, dataOut) {
            fs.writeFile(options.path + '.ut-subs', dataOut, { encoding: options.outEnc}, function(err){
                exceptionHandler(err);
                //program end
            });
        }

        return function(options) {
            fs.readFile( options.path, { encoding: options.inEnc}, function(err, data){
                exceptionHandler(err);
                saveFile(options, convertData(data));
            });
        };
	}

    //--------------------------------------------------------------------

    //The Function:
    function runner(console, convertFile) {
        return function(args) {
            var convertOptions;

            if(args.length < 3) {
                console.log('usage:');
                console.log('node ut-subs.js <file-to-conver> [in-encoding] [out-encoding]');
                console.log('node ut-subs.js --version');
                return;
            }
            if( args[2] === '--version' ) {
                console.log(APP_NAME);
                return;
            }
            convertOptions = {
                path : args[2],
                inEnc: !!args[3] ? args[3] : 'utf-8',
                outEnc: !!args[4] ? args[4] : 'utf-8'
            };
            convertFile(convertOptions);
        };
    }

    //--------------------------------------------------------------------

    function exceptionHandlerPrintExit(process, console) {
        return function(err) {
            if(err) {
                console.log('Exception occurred:\n' + err);
                console.log('Stack:\n' + err.stack);
                process.exit(1);
            }
        };
    }

    //--------------------------------------------------------------------

    function standardRunGraph(console, fs, process) {
        //creating dependency graph
        var _nextLineGetter_ = nextLineGetter(),
            _UtTime_ = utTime(),
            _formatter_ = tmplayerFormatter(),
            _exceptionHandler_ = exceptionHandlerPrintExit(process, console),
            _convertData_ = dataConverter(_nextLineGetter_, _UtTime_, _formatter_),
            _convertFile = fileConverter(fs, _convertData_, _exceptionHandler_),
            _runner_ = runner(console, _convertFile);

        return function(args) {
            _runner_(args);
        };
    }

    //--------------------------------------------------------------------

    if(require.main === module) {
        //called directly, run!
        standardRunGraph(console, fs)(process.argv);

    } else {

        // else - require as module, maybe for unit tests?
        // do nothing, only export.
        exports.APP_NAME = APP_NAME;
        exports.nextLineGetter = nextLineGetter;
        exports.utTime = utTime;
        exports.tmplayerFormatter = tmplayerFormatter;
        exports.dataConverter = dataConverter;
        exports.fileConverter = fileConverter;
        exports.exceptionHandlerPrintExit = exceptionHandlerPrintExit;
        exports.runner = runner;
        exports.standardRunGraph = standardRunGraph;

    }

})(process, require('fs'), console, exports, module);


