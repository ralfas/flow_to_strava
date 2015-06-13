.PHONY: all build clean

all: clean build

build:
	cp src/manifest.json build/
	cat src/zip.js src/inflate.js src/core.js > build/background.js

clean:
	rm -f build/*
