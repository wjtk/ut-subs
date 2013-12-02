/*global require */
/* global jasmine, describe, expect, it, xit, beforeEach, afterEach, spyOn */     //jasmine

/* global console */
/* global asyncSpecDone, asyncSpecWait */

var fs = require('fs');
var exec = require('child_process').exec;


beforeEach(function() {
    'use strict';

    this.addMatchers({
        toHaveEqualContent: function(expectedFile) {
            this.message = function() {
                var notTxt = this.isNot ? ' not ' : ' ';
                return 'Expected files' + notTxt +  'to have equal content:\n' +
                    '\t1) ' + this.actual.getPath() + '\n' +
                    '\t2) ' + expectedFile.getPath();
            };
            return this.actual.getContent() === expectedFile.getContent();
        }
    });
});



function FileContent(path, flagDone, encoding) {
    'use strict';
    var content;
    encoding = !encoding ? 'utf-8' : encoding;

    this.getContent = function() {
        return content;
    };

    this.getPath = function() {
        return path;
    };

    fs.readFile( path, { encoding: encoding }, function(err, data){
        if(err) { throw err; }
        content = data.replace(/\r/g, '');
        flagDone.taskDone();
    });
}


function FlagSpecDone(countBarrier) {
    'use strict';
    var
        count = 0,
        noop = function(){},
        expectFn = noop,
        taskDoneListener = noop;


    asyncSpecWait();

    function funOrNoop(fun) {
        return (typeof fun === 'function') ? fun : noop;
    }
    this.setExpectFun = function(fun) {
        expectFn = funOrNoop(fun);
    };
    this.setTaskDoneListener = function(fun) {
        taskDoneListener = funOrNoop(fun);
    };

    this.taskDone = function() {
        count += 1;
        taskDoneListener(count);
        if(count >= countBarrier) {
            expectFn();
            asyncSpecDone();
        }
    };
}


describe('e2e test', function(){
    'use strict';

    function testConversion(pSource, pConverted, pExpected) {
        var flag = new FlagSpecDone(2),
            fConverted, fExpected;

        exec('node src/main/javascript/ut-subs.js ' + pSource, function(err){
            if(err) { throw err; }
            fConverted = new FileContent(pConverted, flag);
            fExpected = new FileContent(pExpected, flag);
            flag.setExpectFun(function() {
                expect(fConverted).toHaveEqualContent(fExpected);
            });
        });

    }

    it('should convert from utf-8 to utf-8', function(){
        testConversion('target/e2e-data/ex1(utf-8).txt', 'target/e2e-data/ex1(utf-8).txt.ut-subs', 'target/e2e-data/ex1(utf-8).expected');
    });


    it('raw use of [asyncSpecWait/Done] - this is only info to not to wait for other expect()\'s', function(){
        var ok = false;

        asyncSpecWait();

        setTimeout(function(){
            expect(ok).toBe(false);

            setTimeout(function(){
                ok = true;
                expect(ok).toBe(true);
                asyncSpecDone();
            },50);
        },100);
        expect(ok).toBe(false);
    });


    it('test of "FlagSpecDone", for 3. tasks', function(){
        var f = new FlagSpecDone(3);
        var i = 0;

        function inc() {
            i +=1;
            f.taskDone();
        }

        console.log('test of "FlagSpecDone, counting....');
        f.setTaskDoneListener( function(count){
            console.log('flag: ' + count);
        });

        setTimeout(inc,1500);
        setTimeout(inc,1000);
        setTimeout(inc,500);
        f.setExpectFun(function() {
            expect(i).toBe(3);      //Important! expect() have to be inside callback!
        });
    });


});