package main

import (
	"fmt"
	"go-music/go-api/names"
	"io"
	"log"
	"os"
	"strconv"
)

func main() {
	fmt.Println(names.MyName("Vargas"))
	var a string
	for x := 0; x < 10; x++ {
		a += strconv.Itoa(x+1) + " "
	}
	fmt.Println(a)
	if _, err := io.Copy(os.Stdout, os.Stdin); err != nil {
		log.Fatal(err)
	}
}
