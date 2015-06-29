
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
}
