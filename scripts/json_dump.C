
void json_dump(TString rootfile, int eventNo)
{
    gROOT->ProcessLine(".L convert.C+");
    TString dirname;
    dirname.Form("%i", eventNo);
    gSystem->MakeDirectory(dirname.Data());

    const int NOBJECTS = 4;
    TString olist[NOBJECTS] = {
        "rec_simple",
        "rec_charge_blob",
        "rec_charge_cell",
        "truth"
    };
    TString jsonfile;

    for (int i=0; i<NOBJECTS; i++) {
        jsonfile.Form("%s/%i-%s.json",dirname.Data(), eventNo, olist[i].Data());
        ofstream out(jsonfile.Data());
        convert(rootfile, olist[i], out);
    }


    // ofstream out("6-rec_simple.json");
    // convert("gamma_shower3D.root", "rec_simple", out);
    // ofstream out2("6-truth.json");
    // convert("gamma_shower3D.root", "truth", out2);
    // ofstream out3("6-rec_charge.json");
    // convert("gamma_shower3D.root", "rec_charge", out3);

    // ofstream out("2-rec_simple.json");
    // convert("cosmic_shower3D.root", "rec_simple", out);
    // ofstream out2("2-truth.json");
    // convert("cosmic_shower3D.root", "truth", out2);
    // ofstream out3("2-rec_charge.json");
    // convert("cosmic_shower3D.root", "rec_charge", out3);

    // ofstream out("3-rec_simple.json");
    // convert("pi0_shower3D.root", "rec_simple", out);
    // ofstream out2("3-truth.json");
    // convert("pi0_shower3D.root", "truth", out2);
    // ofstream out3("3-rec_charge.json");
    // convert("pi0_shower3D.root", "rec_charge", out3);

    // gROOT->ProcessLine(".L pcl.C+");

    // ofstream out("2-truth.pcd");
    // pcl("cosmic_shower3D.root", "truth", out);

    // ofstream out("1-rec_charge.pcd");
    // pcl("ele_shower3D.root", "rec_charge", out);

    // ofstream out("2-rec_charge.pcd");
    // pcl("cosmic_shower3D.root", "rec_charge", out);

    // ofstream out("3-rec_charge.pcd");
    // pcl("pi0_shower3D.root", "rec_charge", out);

}
