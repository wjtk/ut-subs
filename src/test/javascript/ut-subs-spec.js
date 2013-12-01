/*global require */
/* global jasmine, describe, expect, it, xit, beforeEach, afterEach, spyOn */     //jasmine

(function(){
    'use strict';
    var UT = require('../../main/javascript/ut-subs.js');


    describe('utTime', function(){
        var UtTime = UT.utTime();

        it('should create object with numerical properties', function(){
            var t = new UtTime('123','23');
            expect(t.minutes).toBe(123);
            expect(t.seconds).toBe(23);
        });


        describe('isGreaterThanOrEqualTo',function(){
            var t1 = new UtTime('123','23'),
                t2 = new UtTime('124','23'),
                t3 = new UtTime('12','23'),
                t4 = new UtTime('123','23'),
                t5 = new UtTime('0', '10'),
                t6 = new UtTime('0', '09');

            it('comparison tests', function(){
                expect(t1.isGreaterThanOrEqualTo(t2)).toBeFalsy();
                expect(t2.isGreaterThanOrEqualTo(t1)).toBeTruthy();

                expect(t1.isGreaterThanOrEqualTo(t3)).toBeTruthy();

                expect(t1.isGreaterThanOrEqualTo(t4)).toBeTruthy();
                expect(t4.isGreaterThanOrEqualTo(t1)).toBeTruthy();

                expect(t6.isGreaterThanOrEqualTo(t5)).toBeFalsy();
            });
        });
    });


    describe('nextLineGetter', function(){
        var nextLineGetter = UT.nextLineGetter();

        it('should return lines', function(){
            var nextLine = nextLineGetter('aaa\r\n1 2\n67 b');
            expect(nextLine()).toBe('aaa');
            expect(nextLine()).toBe('1 2');
            expect(nextLine()).toBe('67 b');
            expect(nextLine()).toBe(null);
            expect(nextLine()).toBe(null);
        });

        it('should return empty lines', function(){
            var nextLine = nextLineGetter('\n\n');
            expect(nextLine()).toBe('');
            expect(nextLine()).toBe('');
            expect(nextLine()).toBe(null);
        });

        it('should return null if data is empty', function(){
            var nextLine = nextLineGetter('');
            expect(nextLine()).toBe(null);
        });
    });

    describe('dataConverter', function(){
        var UtTime = UT.utTime(),
            convertData, formatterMock,
            lines, DATA ='DATA', DATA_OUT = 'DATA_OUT';

        function nextLineGetterFake(data) {
            var i = 0;
            expect(data).toBe(DATA);
            return function() {
                if(i >= lines.length ) { return null; }
                return lines[i++];
            };
        }

        beforeEach(function(){
            formatterMock = { nextLine : null, getDataOut : null };
            spyOn(formatterMock, 'nextLine');
            spyOn(formatterMock, 'getDataOut').andReturn(DATA_OUT);
            convertData = UT.dataConverter(nextLineGetterFake, UtTime, formatterMock);
        });

        it('should convert correctly, simple example', function(){
            lines = ['0:11', 'first', '12:22', 'second'];
            expect(convertData(DATA)).toBe(DATA_OUT);

            expect(formatterMock.nextLine.calls.length).toBe(2);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'first');
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('12','22'), 'second');
            expect(formatterMock.getDataOut.calls.length).toBe(1);
        });

        it('should throw that times are not in order', function(){
            lines = ['0:10', 'jeden', '0:09', 'dwa'];
            expect( function() {convertData(DATA); }).toThrow('Time is not in order, line no: 4');
        });

        it('should throw that times are not in order, for multiple time-lines', function(){
            lines = ['0:10', '0:15', '0:14', 'dwa'];
            expect( function() {convertData(DATA); }).toThrow('Time is not in order, line no: 3');
        });

        it('should omit multiple time lines', function(){
            lines = ['0:11', '0:15', '0:17', 'line'];
            convertData(DATA);
            expect(formatterMock.nextLine.calls.length).toBe(1);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','17'), 'line');
        });

        it('should throw that text-line was not preceded by time-line', function(){
            lines = ['0:11', 'text', 'text2'];
            expect( function() { convertData(DATA); }).toThrow('Text-line was not preceded by time-line, line no: 3');
            lines = ['text'];
            expect( function() { convertData(DATA); }).toThrow('Text-line was not preceded by time-line, line no: 1');
        });

        it('should omit empty lines', function(){
            lines = ['0:11', '', '', 'text'];
            convertData(DATA);
            expect(formatterMock.nextLine.calls.length).toBe(1);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');
        });

        it('should right trim text lines', function(){
            lines = ['0:11', 'text             '];
            convertData(DATA);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');
        });

        it('should ignore right spaces in time lines', function(){
            lines = ['0:11  ', 'text'];
            convertData(DATA);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');

        });
    });

    describe('tmplayerFormatter', function(){
        var formatter = UT.tmplayerFormatter(),
            UtTime = UT.utTime();

        it('should format correctly', function(){
            formatter.nextLine( new UtTime('123','09'), 'first' );
            formatter.nextLine( new UtTime('1','45'), 'second' );
            formatter.nextLine( new UtTime('55','00'), 'third' );

            expect(formatter.getDataOut()).toBe(
                '02:03:09:first\n' +
                    '00:01:45:second\n' +
                    '00:55:00:third\n'
            );
        });
    });

    describe('runner', function(){
        var runner, consoleMock, convertFileMock;

        beforeEach(function() {
            consoleMock = { log : null};
            spyOn(consoleMock, 'log');
            convertFileMock = jasmine.createSpy();
            runner = UT.runner(consoleMock, convertFileMock);
        });

        it('should show usage when there are only 2 args', function(){
            runner(['node', 'script']);
            expect(consoleMock.log).toHaveBeenCalledWith('usage:');
        });

        it('should show version with --version', function(){
            runner(['node', 'script', '--version']);
            expect(consoleMock.log).toHaveBeenCalledWith(UT.APP_NAME);
        });

        it('should call convert() with path and default encoding', function(){
            runner(['node', 'script', 'path-to-file']);
            expect(convertFileMock).toHaveBeenCalledWith({ path : 'path-to-file', inEnc : 'utf-8', outEnc : 'utf-8'});
        });

        it('should call convert() with given enodings', function(){
            runner(['node', 'script', 'path', 'in', 'out']);
            expect(convertFileMock).toHaveBeenCalledWith({ path : 'path', inEnc : 'in', outEnc : 'out'});
        });
    });

    describe('fileConverter', function(){
        var convertFile, convertDataMock, fileSystemMock,
            DATA = 'data', DATA_OUT = 'data_out',
            convertOptions = { path: 'path-to-file', inEnc : 'in-enc', outEnc : 'out-enc' },
            writeError, readError;

        //noinspection JSUnusedLocalSymbols
        function fsReadFake(path, optionsInEncoding, callbackErrData) {
            callbackErrData(readError, DATA);
        }

        //noinspection JSUnusedLocalSymbols
        function fsWriteFake(path, dataOut, optionsOutEncoding, callbackErr) {
            callbackErr(writeError);
        }

        function callConvertFileWithOptions() {
            convertFile(convertOptions);
        }

        beforeEach(function(){
            writeError = null;
            readError = null;
            convertDataMock = jasmine.createSpy().andReturn(DATA_OUT);
            fileSystemMock = { writeFile : null, readFile : null };
            spyOn(fileSystemMock, 'writeFile').andCallFake( fsWriteFake );
            spyOn(fileSystemMock, 'readFile').andCallFake( fsReadFake );
            convertFile = UT.fileConverter(fileSystemMock, convertDataMock);
        });

        describe('happy path', function(){
            beforeEach(function(){
                callConvertFileWithOptions();
            });

            it('should call readFile()', function(){
                expect(fileSystemMock.readFile).toHaveBeenCalledWith('path-to-file', {encoding: 'in-enc'}, jasmine.any(Function) );
            });

            it('should call convertData()', function(){
                expect(convertDataMock).toHaveBeenCalledWith(DATA);
            });

            it('should call writeFile() with converted data, and ".ut-subs" postfix', function(){
                expect(fileSystemMock.writeFile).toHaveBeenCalledWith('path-to-file.ut-subs', DATA_OUT, {encoding : 'out-enc'}, jasmine.any(Function));
            });
        });

        it('should rethrow exception on file read', function(){
            readError = { x: 'read-exc' };
            expect(callConvertFileWithOptions).toThrow(readError);
        });

        it('should rethrow exception on file write', function(){
            writeError = { x: 'write-exc' };
            expect(callConvertFileWithOptions).toThrow(writeError);
        });
    });

})();





