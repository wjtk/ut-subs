/*global require */
/* global jasmine, describe, expect, it, xit, beforeEach, afterEach, spyOn, createSpyObj */     //jasmine

(function(){
    'use strict';
    var UT = require('../../../main/javascript/ut-subs.js');
    var UtTime = UT.utTime();

    //helpers --------------------------------------------

    function FakeFsReadFile() {
        var readError = null, readData = null;

        this.setReadErrData = function(err, data) {
                readError = err;
                readData = data;
        };

        this.readFile = function(path, optionsInEncoding, callbackErrData) {
                callbackErrData(readError, readData);
        };
    }

    function FakeFsWriteFile() {
        var writeError = null;

        this.setWriteErr = function(err) {
            writeError = err;
        };

        this.writeFile = function(path, dataOut, optionsOutEncoding, callbackErr) {
            callbackErr(writeError);
        };
    }

    //helpers ^^^--------------------------------------------


    describe('utTime', function(){

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
        var convertData, formatterMock,
            DATA ='DATA', DATA_OUT = 'DATA_OUT', nextLineFake;

        function NextLineFake() {
            var lines;

            this.setInputLines = function(lines_) {
                lines = lines_;
            };

            this.nextLineGetter = function(data) {
                var i = 0;
                expect(data).toBe(DATA);
                return function() {
                    if(i >= lines.length ) { return null; }
                    return lines[i++];
                };
            };
        }

        beforeEach(function(){
            nextLineFake = new NextLineFake();
            nextLineFake.setInputLines([]);
            formatterMock = { nextLine : null, getDataOut : null };
            spyOn(formatterMock, 'nextLine');
            spyOn(formatterMock, 'getDataOut').andReturn(DATA_OUT);
            convertData = UT.dataConverter(nextLineFake.nextLineGetter, UtTime, formatterMock);
        });

        it('should convert correctly, simple example', function(){
            nextLineFake.setInputLines(['0:11', 'first', '12:22', 'second']);

            expect(convertData(DATA)).toBe(DATA_OUT);

            expect(formatterMock.nextLine.calls.length).toBe(2);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'first');
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('12','22'), 'second');
            expect(formatterMock.getDataOut.calls.length).toBe(1);
        });

        it('should throw that times are not in order', function(){
            nextLineFake.setInputLines(['0:10', 'first', '0:09', 'second']);

            expect( function() {convertData(DATA); }).toThrow('Time is not in order, line no: 4');
        });

        it('should throw that times are not in order, for multiple time-lines', function(){
            nextLineFake.setInputLines(['0:10', '0:15', '0:14', 'line']);

            expect( function() {convertData(DATA); }).toThrow('Time is not in order, line no: 3');
        });

        it('should omit multiple time lines', function(){
            nextLineFake.setInputLines(['0:11', '0:15', '0:17', 'line']);

            convertData(DATA);

            expect(formatterMock.nextLine.calls.length).toBe(1);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','17'), 'line');
        });

        it('should throw that text-line was not preceded by time-line', function(){
            nextLineFake.setInputLines(['0:11', 'text', 'text2']);
            expect( function() { convertData(DATA); }).toThrow('Text-line was not preceded by time-line, line no: 3');

            nextLineFake.setInputLines(['text']);
            expect( function() { convertData(DATA); }).toThrow('Text-line was not preceded by time-line, line no: 1');
        });

        it('should omit empty lines', function(){
            nextLineFake.setInputLines(['0:11', '', '', 'text']);

            convertData(DATA);

            expect(formatterMock.nextLine.calls.length).toBe(1);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');
        });

        it('should right trim text lines', function(){
            nextLineFake.setInputLines(['0:11', 'text             ']);

            convertData(DATA);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');
        });

        it('should ignore right spaces in time lines', function(){
            nextLineFake.setInputLines(['0:11  ', 'text']);
            convertData(DATA);
            expect(formatterMock.nextLine).toHaveBeenCalledWith(new UtTime('0','11'), 'text');

        });
    });


    describe('tmplayerFormatter', function(){
        var formatter = UT.tmplayerFormatter();

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
            consoleMock = jasmine.createSpyObj('consoleMock', ['log']);
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
        var convertFile, convertDataMock, fileSystemMock, excHandlerMock,
            DATA = 'data', DATA_OUT = 'data_out',
            convertOptions = { path: 'path-to-file', inEnc : 'in-enc', outEnc : 'out-enc' },
            fakeRead, fakeWrite;

        function callConvertFileWithOptions() {
            convertFile(convertOptions);
        }

        beforeEach(function(){
            fakeRead = new FakeFsReadFile();
            fakeWrite = new FakeFsWriteFile();
            fakeRead.setReadErrData(null, DATA);
            excHandlerMock = jasmine.createSpy();
            convertDataMock = jasmine.createSpy().andReturn(DATA_OUT);
            fileSystemMock = { writeFile : null, readFile : null };
            spyOn(fileSystemMock, 'readFile').andCallFake( fakeRead.readFile );
            spyOn(fileSystemMock, 'writeFile').andCallFake( fakeWrite.writeFile );
            convertFile = UT.fileConverter(fileSystemMock, convertDataMock, excHandlerMock);
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


        it('should pass exception to exceptionHandler on file read', function(){
            var err = { x: 'read-exc' };
            fakeRead.setReadErrData(err, null);

            callConvertFileWithOptions();

            expect(excHandlerMock).toHaveBeenCalledWith(err);
        });

        it('should pass exception to exceptionHandler on file write', function(){
            var err = { x: 'write-exc' };
            fakeWrite.setWriteErr(err);

            callConvertFileWithOptions();

            expect(excHandlerMock).toHaveBeenCalledWith(err);
        });
    });

    describe('standardRunGraph (is it unit yet? necessary? maybe e2e are enough?)', function(){
        var runner, fsMock, consoleMock, processMock,
            fakeRead, fakeWrite;

        beforeEach(function(){
            fakeRead = new FakeFsReadFile();
            fakeWrite = new FakeFsWriteFile();
            fsMock =  { readFile: null, writeFile : null };
            spyOn(fsMock, 'readFile').andCallFake( fakeRead.readFile );
            spyOn(fsMock, 'writeFile').andCallFake( fakeWrite.writeFile );

            consoleMock = jasmine.createSpyObj('consoleMock', ['log']);
            processMock = jasmine.createSpyObj('processMock', ['exit']);
            runner = UT.standardRunGraph(consoleMock, fsMock, processMock);
        });

        it('should convert', function(){
            fakeRead.setReadErrData(null, '0:11\nFirst');

            runner(['node', 'script', 'file-in']);

            expect(fsMock.writeFile).toHaveBeenCalledWith(jasmine.any(String), '00:00:11:First\n', jasmine.any(Object), jasmine.any(Function));

        });
    });


    //the triumph of form over substance, is it worth to test such things?
    describe('exceptionHandlerPrintExit', function(){
        var processMock, consoleMock, exceptionHandler;

        beforeEach(function(){
            processMock = jasmine.createSpyObj('processMock', ['exit']);
            consoleMock = jasmine.createSpyObj('consoleMock', ['log']);
            exceptionHandler = UT.exceptionHandlerPrintExit(processMock, consoleMock);
        });

        it('should do nothing if there is no error', function(){
            exceptionHandler(null);

            expect(processMock.exit).not.toHaveBeenCalled();
            expect(consoleMock.log).not.toHaveBeenCalled();
        });

        it('should print error and call exit(1) on error', function(){
            exceptionHandler({ stack : 'stack'});

            expect(processMock.exit).toHaveBeenCalledWith(1);
            expect(consoleMock.log).toHaveBeenCalledWith(jasmine.any(String));
        });
    });

})();





