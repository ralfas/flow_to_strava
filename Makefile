.PHONY: all build clean

all: clean build

build:
	mkdir build
	cp src/manifest.json build/
	cat src/zip.js src/inflate.js src/core.js > build/background.js

clean:
	rm -rf build
