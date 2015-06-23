#include "TFile.h"
#include "TTree.h"
#include "TString.h"

#include <iostream>
#include <iomanip>
#include <fstream>

using namespace std;

void print_vector(ostream& out, vector<double>& v, TString desc, bool end=false);

void convert(TString filename, TString option = "truth", ostream& out = cout)
{
    TFile f(filename);
    TTree *t = 0;
    double x=0, y=0, z=0, q=0, nq=1;
    vector<double> vx, vy, vz, vq, vnq;

    if (option == "truth") {
        t = (TTree*)f.Get("T_true");
    }
    else if (option == "rec_simple") {
        t = (TTree*)f.Get("T_rec");
    }
    else if (option == "rec_charge_blob") {
        t = (TTree*)f.Get("T_rec_charge");
    }
    else if (option == "rec_charge_cell") {
        t = (TTree*)f.Get("T_rec_charge_blob");
    }
    else {
        cout << "ERROR: Wrong option: " << option << endl;
        exit(0);
    }

    t->SetBranchAddress("x", &x);
    t->SetBranchAddress("y", &y);
    t->SetBranchAddress("z", &z);
    if (option != "rec_simple") {
        t->SetBranchAddress("q", &q);
    }
    if (option.Contains("charge")) {
        t->SetBranchAddress("nq", &nq);
    }
    int nEvents = t->GetEntries();
    for (int i=0; i<nEvents; i++) {
        t->GetEntry(i);
        vx.push_back(x);
        vy.push_back(y);
        vz.push_back(z);
        vq.push_back(q);
        vnq.push_back(nq);
    }

    out << fixed << setprecision(1);
    out << "{" << endl;

    print_vector(out, vx, "x");
    print_vector(out, vy, "y");
    print_vector(out, vz, "z");

    out << fixed << setprecision(0);
    print_vector(out, vq, "q");
    print_vector(out, vnq, "nq");


    out << '"' << "type" << '"' << ":" << '"' << option << '"' << endl;

    out << "}" << endl;

}

void print_vector(ostream& out, vector<double>& v, TString desc, bool end)
{
    int N = v.size();

    out << '"' << desc << '"' << ":[";
    for (int i=0; i<N; i++) {
        out << v[i];
        if (i!=N-1) {
            out << ",";
        }
    }
    out << "]";
    if (!end) out << ",";
    out << endl;
}
