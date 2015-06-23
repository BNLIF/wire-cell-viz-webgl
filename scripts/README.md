# How to make those JSON files

To create the JSON files for web display, run

```bash
root -b -q 'json_dump.C("example_data/nue.root", 5)'
```

This will create a directory with the following structure
```
└── 5
    ├── 5-rec_charge_blob.json
    ├── 5-rec_charge_cell.json
    ├── 5-rec_simple.json
    └── 5-truth.json
```
Each `.json` file represents the results from a reconstruction algorithm or MC, which will be rendered in the webgl as a *PointCloud* object.

This directory can then be placed directly under the `SITEROOT/data` directory and the *Event Display* knows how to retrieve those data.
