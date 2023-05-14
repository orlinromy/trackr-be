SHELL := /bin/bash

.PHONY: test build

dev:
	npm run dev

build:
	npm i 
	npm run build

start:
	npm run start