# wire-cell-viz-webgl

## Installation

    git clone https://github.com/BNLIF/wire-cell-viz-webgl.git mydir
    cd mydir
    python -m SimpleHTTPServer

Now open your browser and go to [http://localhost:8000/](http://localhost:8000/)

(this directory can be directly placed on any web servers. The above python one-liner is one convenient way to server a directory)

## Features

  - Event navigation
    - use the event slider or the keyboard shortcut "n" (Next) / "p" (Previous)
  - Sliced view mode
  - 3D interactive
  - Touch device friendly

## Requirements

A modern browser supporting WebGL is need.
For a list of compatible browsers see [here](http://caniuse.com/#feat=webgl).
We found that [Google Chrome](http://www.google.com/chrome/) has the best performance.

## FAQS

* How to make my own events?

Follow the instruction [here](scripts).
