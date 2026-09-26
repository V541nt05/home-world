import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/invoice/$id")({
  head: () => ({
    meta: [
      { title: "Invoice — Home World" },
      { name: "description", content: "Home World tax invoice." },
    ],
  }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();

  const invoice = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          orders (
            id,
            created_at,
            order_items (
              product_name,
              brand,
              quantity,
              unit_price,
              total
            )
          )
        `,
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (invoice.isLoading) return <Loading />;
  if (invoice.error) return <ErrorState />;
  if (!invoice.data) return <Empty label="Invoice not found." />;

  const i = invoice.data;
  const order = i.orders;
  const items = order?.order_items ?? [];

  // Mirrors the sample bill's 18% GST split (9% CGST + 9% SGST).
  // The stored order total remains the invoice total.
  const gstRate = 18;
  const gstTotal = Number(i.total) - Number(i.total) / (1 + gstRate / 100);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const taxableValue = Number(i.total) - gstTotal;

  const dateOnly = (value: string) => {
    const [y, m, d] = value.split("-");
    return [d, m, y].filter(Boolean).join("/");
  };

  return (
    <>
      <style>{`
      @page {
        size: A4;
        margin: 10mm;
      }

      @media print {
        html,
        body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .invoice-page {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .invoice-box {
          border: 1px solid #222 !important;
          box-shadow: none !important;
        }

        .invoice-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .invoice-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `}</style>
      <div className="invoice-page mx-auto max-w-3xl px-3 py-6 sm:px-4 print:max-w-none print:p-0">
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        <div className="invoice-box overflow-hidden border bg-white text-black shadow-sm print:shadow-none">
          <header className="border-b-2 px-5 py-5 text-center sm:px-8">
            <img
              src="/public/logo.png"
              alt="Home World"
              className="mx-auto mb-1 h-20 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold tracking-wide text-[#174a7e]">HOME WORLD</h1>
            <p className="mt-0.5 text-sm font-bold text-red-600">
              Srv. No. 144, Dhayari Garmal, near Khandoba Mandir, Dhayari,
              <br />
              Pune – 411041
            </p>
            <p className="text-sm font-bold text-red-600">
              Cont. No. 9890265356, e-mail- homeworld_6@rediffmail.com
            </p>
            <p className="mt-0.5 text-sm font-bold text-red-600">GST NO. 27AJIPD5314K1Z9</p>
          </header>

          <div className="grid grid-cols-2 border-b text-sm">
            <div className="border-r p-3">
              <div className="font-bold">BILL TO</div>
              <div className="mt-2 font-semibold">{i.customer_name}</div>
              {i.customer_phone && <div>{i.customer_phone}</div>}
              {i.customer_address && (
                <div className="mt-1 whitespace-pre-line">{i.customer_address}</div>
              )}
            </div>

            <div className="p-3">
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                <span className="font-semibold">DATE</span>
                <span>{dateOnly(i.invoice_date)}</span>
                <span className="font-semibold">INVOICE</span>
                <span>{i.invoice_number}</span>
                <span className="font-semibold">ORDER</span>
                <span>#{String(i.order_id).slice(-6)}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="invoice-table w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#315b82] text-white">
                  <th className="border px-2 py-2 text-center">Sr. No.</th>
                  <th className="border px-2 py-2 text-left">DESCRIPTION</th>
                  <th className="border px-2 py-2 text-right">RATE</th>
                  <th className="border px-2 py-2 text-center">QTY.</th>
                  <th className="border px-2 py-2 text-right">AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.product_name}-${index}`}>
                    <td className="border px-2 py-2 text-center">{index + 1}</td>
                    <td className="border px-2 py-2">
                      <div className="font-medium">{item.product_name}</div>
                      {item.brand && <div className="text-xs text-black">{item.brand}</div>}
                    </td>
                    <td className="border px-2 py-2 text-right">{inr(item.unit_price)}</td>
                    <td className="border px-2 py-2 text-center">{item.quantity}</td>
                    <td className="border px-2 py-2 text-right font-medium">{inr(item.total)}</td>
                  </tr>
                ))}

                <tr>
                  <td className="border px-2 py-2" colSpan={2}></td>
                  <td className="border px-2 py-2 text-right font-semibold">Taxable Value</td>
                  <td className="border px-2 py-2"></td>
                  <td className="border px-2 py-2 text-right">{inr(taxableValue)}</td>
                </tr>

                <tr>
                  <td className="border px-2 py-2" colSpan={2}></td>
                  <td className="border px-2 py-2 text-right font-semibold">CGST - 9%</td>
                  <td className="border px-2 py-2"></td>
                  <td className="border px-2 py-2 text-right">{inr(cgst)}</td>
                </tr>

                <tr>
                  <td className="border px-2 py-2" colSpan={2}></td>
                  <td className="border px-2 py-2 text-right font-semibold">SGST - 9%</td>
                  <td className="border px-2 py-2"></td>
                  <td className="border px-2 py-2 text-right">{inr(sgst)}</td>
                </tr>

                <tr>
                  <td className="border px-2 py-2" colSpan={3}></td>
                  <td className="border px-2 py-2 text-right font-semibold">Gross Total</td>
                  <td className="border px-2 py-2 text-right font-semibold">{inr(i.total)}</td>
                </tr>

                <tr>
                  <td className="border px-2 py-2" colSpan={3}></td>
                  <td className="border px-2 py-2 text-right font-semibold">Round Off</td>
                  <td className="border px-2 py-2 text-right">₹0.00</td>
                </tr>

                <tr>
                  <td className="border px-2 py-2" colSpan={3}></td>
                  <td className="border px-2 py-2 text-right text-base font-bold">NET TOTAL</td>
                  <td className="border px-2 py-2 text-right text-base font-bold">
                    {inr(i.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="invoice-section border-t p-4 text-sm">
            <p className="font-bold">Installment facility not available</p>

            <ul className="mt-2 list-none space-y-1 text-black">
              <li>* Please check the material before taking delivery.</li>
              <li>* We will not be responsible for short receipt later on.</li>
              <li>* Subject to Pune jurisdiction.</li>
            </ul>

            <p className="mt-4 leading-5 text-black">
              I/We hereby certify that my/our registration certificate under the Goods and Service
              Tax Act, 2017 is in force on the date on which the sale of the goods specified in this
              tax invoice is made by me/us and that the transaction of sale covered by this tax
              invoice has been effected and the due tax has been accounted for.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-8 font-semibold">
              <div>Customer&apos;s signature</div>
              <div className="text-right">For Home World</div>
            </div>

            <p className="mt-5 text-center text-base font-semibold italic text-green-600">
              Thank You For Your Business!
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
