rollup := node_modules/.bin/rollup

js := dist/litjsx.esm.mjs dist/litjsx.umd.js dist/litjsx.min.js
map := $(js:js=js.map)
output := $(js) $(map)

all: $(output)

$(output): src/litjsx.ts
	$(rollup) -c

clean:
	rm -rf dist

.PHONY: all clean