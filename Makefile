.PHONY: build dist

BUILD=qpack build index.ts@node -o lib --no-es6

build:
	$(BUILD)

watch:
	$(BUILD) -w

.PHONY: test
test:
	mocha test

.PHONY: watch-test
build-test:
	qpack build *.test.ts --target=node -w -o test