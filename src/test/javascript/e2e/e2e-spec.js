/*global require */
/* global jasmine, describe, xdescribe, expect, it, xit, beforeEach, afterEach, spyOn, runs, waitsFor */     //jasmine

/* global console */
/* global asyncSpecDone, asyncSpecWait */


var fs = require('fs');
var exec = require('child_process').exec;


describe('e2e test', function(){
    'use strict';

    function e2eLog(message) {
        console.log('e2e>> ' + message);

    }

    function testConversion(pSource, pConverted, pExpected, sourceEncodingOpt, targetEncodingOpt) {
        var flag = {};

        function wait(message) {
            waitsFor(function(){ return flag.further;}, message, 2000);
        }

        function clearWaitingOrThrow() {
            if(flag.err) {
                if(!!flag.stdOut || flag.stdErr) {
                    e2eLog('Error occurred with additional info:');
                    e2eLog('ERR:' + flag.err);
                    e2eLog('STDOUT: ' + flag.stdOut);
                    e2eLog('STDERR: ' + flag.stdErr);
                }
                throw flag.err;
            }
            flag.further = false;
            flag.err = null;
            flag.stdOut = null;
            flag.stdErr = null;
        }

        function goFurther(flag, err) {
            flag.err = err;
            flag.further = true;
        }

        function readFile(path, flag, encoding) {
            encoding = !encoding ? 'utf-8' : encoding;
            flag.content = null;
            fs.readFile( path, { encoding: encoding }, function(err, data){
                flag.content = data;
                goFurther(flag, err);
            });
        }

        //-----------
        sourceEncodingOpt = !sourceEncodingOpt ? '' : sourceEncodingOpt;

        runs(function(){
            var command = 'node src/main/javascript/ut-subs.js ' + pSource + ' ' + sourceEncodingOpt;

            clearWaitingOrThrow();
            e2eLog('running command:');
            e2eLog(command);
            exec(command, function(err, stdout, stdErr){
                flag.stdOut = '' + stdout;
                flag.stdErr = '' + stdErr;
                goFurther(flag, err);
            });
        });

        wait('should convert file with "ut-subs"');

        runs(function(){
            clearWaitingOrThrow();
            readFile(pConverted, flag, targetEncodingOpt);
        });

        wait('should read converted file');

        runs(function(){
            clearWaitingOrThrow();
            flag.convertedContent = flag.content;
            readFile(pExpected, flag, targetEncodingOpt);
        });

        wait('should read expected file');

        runs(function(){
            clearWaitingOrThrow();
            flag.expectedContent = flag.content;

            //At last, comparing contents
            expect(flag.convertedContent.replace(/\r/g,'')).toBe(flag.expectedContent.replace(/\r/g,''));
        });
    }

    it('should convert from utf-8 to utf-8', function(){
        testConversion('target/e2e-data/ex1_utf-8.txt', 'target/e2e-data/ex1_utf-8.txt.ut-subs', 'target/e2e-data/ex1_utf-8.expected');
    });


     it('should convert from utf-16le to utf-8', function(){
        testConversion('target/e2e-data/ex2_utf-16le.txt', 'target/e2e-data/ex2_utf-16le.txt.ut-subs', 'target/e2e-data/ex2_utf-8.expected', 'utf-16le');
     });


    //-----------------------------------------------------

    it('raw use of [asyncSpecWait/Done] (All ok, BUT if exception in timeout callback, all disappear silently!)', function(){
        var ok = false;

        asyncSpecWait();

        setTimeout(function(){
            expect(ok).toBe(false);

            setTimeout(function(){
                ok = true;
                expect(ok).toBe(true);
                //throw 'this is not safe, I rather like jasmine way'
                asyncSpecDone();
            },50);
        },100);
        expect(ok).toBe(false);
    });
});

//---------------------------------------------------------





