import { getContactPage } from "@/lib/contact";
import { getCustomerList } from "@/lib/customer";
import { ContactTable } from "./_components/contact-table";

export default async function ContactPage() {
  const [page, customerOptions] = await Promise.all([
    getContactPage(),
    getCustomerList(),
  ]);

  return (
    <div className="space-y-4 p-6">
      <ContactTable initialPage={page} customerOptions={customerOptions} />
    </div>
  );
}
