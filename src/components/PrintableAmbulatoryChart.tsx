import React, { forwardRef } from "react";

interface PrintableAmbulatoryChartProps {
  job: any;
  patient: any;
}

export const PrintableAmbulatoryChart = forwardRef<HTMLDivElement, PrintableAmbulatoryChartProps>(
  ({ job, patient }, ref) => {
    if (!job || !patient) return null;

    const res = job.result || {};
    const fields = res.fields || {};
    const diagnoses = res.diagnoses || [];
    const procedures = res.procedures || [];

    const formatSzakma = (str?: string) => {
      if (!str) return "Nincs adat";
      if (str === "nincs adat") return "Nincs adat";
      return str;
    };

    const tajType = patient?.taj_szam ? "1" : "0";
    const patientGender = patient?.nem === "Férfi" ? "1" : patient?.nem === "Nő" ? "2" : "";
    
    // Format dates to YYYYMMDD
    const formatDateObj = (d: Date | string) => {
      if (!d) return "";
      const date = new Date(d);
      return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    };

    const CellArray = ({ value, length }: { value?: string, length: number }) => {
      const str = String(value || "").replace(/[-\s]/g, ""); // Remove hyphens/spaces
      const chars = str.padEnd(length, " ").split("").slice(0, length);
      return (
        <div className="flex border-l border-t border-b border-black w-fit bg-white">
          {chars.map((char, i) => (
            <div key={i} className="w-5 h-5 border-r border-black flex items-center justify-center font-bold text-[12px]">
              {char.trim()}
            </div>
          ))}
        </div>
      );
    };

    const TableRow = ({ num, label, value, cells, boldValue = false }: { num: string, label: string, value: any, cells?: number, boldValue?: boolean }) => (
      <tr className="border border-black break-inside-avoid">
        <td className="border-r border-black p-1 w-12 text-center font-bold bg-gray-50">{num}.</td>
        <td className="border-r border-black p-1 w-64 bg-gray-50">{label}:</td>
        <td className={`p-1 pl-3 ${boldValue && !cells ? 'font-bold' : ''}`}>
          {cells ? <CellArray value={value} length={cells} /> : (value || "")}
        </td>
      </tr>
    );

    return (
      <div style={{ display: "none" }}>
        <div 
          ref={ref} 
          className="bg-white text-black p-8 w-full mx-auto"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* HIVATALOS FEJLÉC */}
          <div className="text-[10px] text-gray-500 mb-4">
            [6/A. számú melléklet a 43/1999. (III. 3.) Korm. rendelethez]
          </div>
          <h1 className="text-xl font-bold text-center mb-6 uppercase tracking-wider">Ambuláns adatlap és Szakorvosi Lelet</h1>

          {/* SZAKORVOSI LELET RÉSZ */}
          <div className="mb-8 text-[12px]">
            <h2 className="font-bold text-sm mb-2 uppercase pb-1">Orvosi dokumentáció</h2>
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr className="break-inside-avoid">
                  <td className="border border-black p-2 align-top w-1/3 bg-gray-50 font-bold">Anamnézis és Jelen Panaszok</td>
                  <td className="border border-black p-2 whitespace-pre-wrap text-justify leading-relaxed">{formatSzakma(res.pap_history)}</td>
                </tr>
                <tr className="break-inside-avoid">
                  <td className="border border-black p-2 align-top bg-gray-50 font-bold">Kezelések / Vizsgálatok</td>
                  <td className="border border-black p-2 whitespace-pre-wrap text-justify leading-relaxed">{formatSzakma(res.pap_treatments)}</td>
                </tr>
                <tr className="break-inside-avoid">
                  <td className="border border-black p-2 align-top bg-gray-50 font-bold">Javasolt Gyógyszerek</td>
                  <td className="border border-black p-2 whitespace-pre-wrap text-justify leading-relaxed">{formatSzakma(res.pap_drugs)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HIVATALOS 40 PONTOS FORMANYOMTATVÁNY */}
          <div>
            <h2 className="font-bold text-sm mb-2 uppercase">Adminisztratív Adatok (NEAK)</h2>
            <table className="w-full border-collapse border border-black text-[11px] leading-tight">
              <tbody>
                <TableRow num="1" label="Javítás" value="0" cells={1} />
                <TableRow num="2" label="Eredeti dátum" value="" cells={8} />
                <TableRow num="3" label="Eredeti szakrendelő" value="" cells={4} />
                <TableRow num="4" label="Eredeti naplósorszám" value="" cells={8} />
                <TableRow num="5" label="Naplósorszám" value="" cells={8} />
                <TableRow num="6" label="Rendelő neve" value="ClinicNote Rendszer" />
                <TableRow num="7" label="Rendelő azonosítója" value="" cells={9} />
                <TableRow num="8" label="Beutaló munkahely neve" value="" />
                <TableRow num="9/A" label="Beutaló orvos munkahelyének azonosítója" value="" cells={9} />
                <TableRow num="9/B" label="Beutaló orvos kódja" value="" cells={5} />
                <TableRow num="9/C" label="Beutalást igazoló adat" value="" cells={8} />
                <TableRow num="9/D" label="Beutaló kelte" value="" cells={8} />
                <TableRow num="9/E" label="Elektronikus beutaló EESZT azonosítója" value="" />
                <TableRow num="10" label="Térítési kategória" value={fields.teritesi_kategoria || "01"} cells={2} />
                <TableRow num="10/A" label="Részleges térítési díj" value="" />
                <TableRow num="11" label="Ellátást végző orvos/szakdolgozó kódja" value="" cells={5} />
                <TableRow num="11/A" label="Ellátást végző kódjának típusa" value="1" cells={1} />
                <TableRow num="12" label="Érvényes biztosítás országa" value="HU" cells={2} />
                <TableRow num="13" label="Személyazonosító jel (TAJ)" value={patient?.taj_szam} cells={9} />
                <TableRow num="14" label="Személyazonosító típusa" value={tajType} cells={1} />
                <TableRow num="15" label="Beteg neve" value={`${patient?.titulus ? patient.titulus + ' ' : ''}${patient?.vezeteknev} ${patient?.keresztnev}`} boldValue />
                <TableRow num="16" label="Születési dátum" value={formatDateObj(patient?.szuletesi_datum)} cells={8} />
                <TableRow num="17" label="Anyja neve" value={patient?.anyja_neve || ""} />
                <TableRow num="18" label="A beteg leánykori neve" value={patient?.leanykori_neve || ""} />
                <TableRow num="19" label="Lakcím" value={`${patient?.iranyitoszam || ""} ${patient?.varos || ""} ${patient?.utca_hazszam || ""}`} />
                <TableRow num="20" label="Kezelés ideje" value={job?.created_at ? formatDateObj(job.created_at) : ""} cells={8} />
                <TableRow num="21" label="Beteg neme" value={patientGender} cells={1} />
                <TableRow num="22" label="Ellátás típusa" value={fields.ellatas_tipusa || "1"} cells={1} />
                <TableRow num="23" label="Továbbküldés" value={fields.tovabbkuldes || "0"} cells={1} />
                <TableRow num="24" label="Baleset minősítése" value={fields.baleset_minositese || "00"} cells={2} />
                <TableRow num="25" label="E-adatlap kitöltés" value="1" cells={1} />
                
                {/* 26. DIAGNÓZISOK */}
                <tr className="border border-black break-inside-avoid">
                  <td colSpan={3} className="p-0 border-none">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="bg-gray-100 break-inside-avoid">
                          <td colSpan={3} className="border-b border-black p-1 font-bold pl-3">26. DIAGNÓZISOK</td>
                        </tr>
                        <tr className="bg-gray-50 break-inside-avoid">
                          <td className="border-r border-b border-black p-1 font-bold text-center w-12">Ssz.</td>
                          <td className="border-r border-b border-black p-1 font-bold text-center w-40">Kód</td>
                          <td className="border-b border-black p-1 font-bold text-center">Megnevezés</td>
                        </tr>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`diag-${i}`} className="break-inside-avoid">
                            <td className="border-r border-b border-black p-1 text-center font-bold bg-gray-50">-{i + 1}</td>
                            <td className="border-r border-b border-black p-1 flex justify-center py-2">
                              <CellArray value={diagnoses[i]?.bno10 || ""} length={5} />
                            </td>
                            <td className="border-b border-black p-1 pl-3 font-bold">{diagnoses[i]?._bno_name || diagnoses[i]?.text_label || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* 27. BEAVATKOZÁSOK */}
                <tr className="border border-black break-inside-avoid">
                  <td colSpan={3} className="p-0 border-none">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="bg-gray-100 break-inside-avoid">
                          <td colSpan={4} className="border-b border-black p-1 font-bold pl-3">27. BEAVATKOZÁSOK</td>
                        </tr>
                        <tr className="bg-gray-50 break-inside-avoid">
                          <td className="border-r border-b border-black p-1 font-bold text-center w-12">Ssz.</td>
                          <td className="border-r border-b border-black p-1 font-bold text-center w-40">Kód</td>
                          <td className="border-r border-b border-black p-1 font-bold text-center w-20">Me.</td>
                          <td className="border-b border-black p-1 font-bold text-center">Megnevezés</td>
                        </tr>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <tr key={`proc-${i}`} className="break-inside-avoid">
                            <td className="border-r border-b border-black p-1 text-center font-bold bg-gray-50">-{i + 1}</td>
                            <td className="border-r border-b border-black p-1 flex justify-center py-2">
                              <CellArray value={procedures[i]?.oeno || ""} length={5} />
                            </td>
                            <td className="border-r border-b border-black p-1 text-center">
                              <div className="flex justify-center">
                                <CellArray value={procedures[i]?.quantity_me || (procedures[i] ? "1" : "")} length={2} />
                              </div>
                            </td>
                            <td className="border-b border-black p-1 pl-3">{procedures[i]?.text_label || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <TableRow num="27/A" label="Beavatkozások jellege" value={fields.beavatkozas_jellege || "V"} cells={1} />
                <TableRow num="28" label="Laboratóriumi vizsgálat kérés" value={fields.labor_keres || "0"} cells={1} />
                <TableRow num="29" label="Képalkotó vizsgálat kérés" value={fields.kepalkoto_keres || "0"} cells={1} />
                <TableRow num="30" label="CT-MRI-PET vizsgálat kérés" value={fields.ct_mri_pet || "0"} cells={1} />
                <TableRow num="31" label="Fizioterápiás ellátásra utalás" value={fields.fizioterapia || "0"} cells={1} />
                <TableRow num="32" label="Útiköltség" value={fields.utikoltseg || "0"} cells={1} />
                <TableRow num="33" label="Keresőképesség elbírálása" value={fields.keresokepesseg || "0"} cells={1} />
                <TableRow num="34" label="Felírt gyógyászati segédeszköz vények száma" value={fields.veny_segedeszkoz || "0"} cells={2} />
                <TableRow num="35" label="Felírt vények száma" value={fields.veny_gyogyszer || "0"} cells={2} />
                <TableRow num="36" label="Felírt gyógyászati ellátás (gyógyfürdő) vények száma" value={fields.veny_gyogyfurdo || "0"} cells={2} />
                <TableRow num="40" label="Intézményi várólista esetazonosító" value="" cells={10} />
              </tbody>
            </table>
          </div>

          {/* ALÁÍRÁS SZEKCIÓ */}
          <div className="mt-12 pt-8 flex justify-between text-[12px] break-inside-avoid">
            <div>
              Dátum: {new Date().getFullYear()} év {String(new Date().getMonth() + 1).padStart(2, '0')} hó {String(new Date().getDate()).padStart(2, '0')} nap
            </div>
            <div className="text-center w-64 border-t border-black pt-1 mt-4">
              az ellátásért felelős orvos<br />
              pecsétszám
            </div>
          </div>

        </div>
      </div>
    );
  }
);

PrintableAmbulatoryChart.displayName = "PrintableAmbulatoryChart";
