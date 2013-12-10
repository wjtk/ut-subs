ut-subs [![Build Status](https://travis-ci.org/wjtk/ut-subs.png?branch=master)](https://travis-ci.org/wjtk/ut-subs)
=======
node.js youtube subtitles converter.
-------------------------------

Converts copied subtitles from format:
```
9:59
So it basically creates a DOM from this string.
10:02
And you can see, we are passing this to compiler and
10:07
applying all these directives, but we don't attach this DOM
```
to readable by video players:
```
00:09:59:So it basically creates a DOM from this string.
00:10:02:And you can see, we are passing this to compiler and
00:10:07:applying all these directives, but we don't attach this DOM
```

usage
-----

* get newest stable version:
```
git checkout v1.2.0
```
, or [download from github](https://github.com/wjtk/ut-subs/releases)
* executable file:
```
src\main\javascript\ut-subs.js
```
* usage help:
```
node ut-subs.js
```
