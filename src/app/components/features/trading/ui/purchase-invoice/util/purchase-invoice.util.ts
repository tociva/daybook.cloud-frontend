import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT, TWO } from "../../../../../../util/constants";
import { formatAmountToFraction, formatAmountToWords, toNumber } from "../../../../../../util/currency.util";
import { convertToNodeDateFormat } from "../../../../../../util/date.util";
import { PurchaseInvoiceItemRequest, PurchaseInvoiceItemTaxRequest, PurchaseInvoiceRequest } from "../../../store/purchase-invoice/purchase-invoice-request.type";
import { PurchaseInvoice } from "../../../store/purchase-invoice/purchase-invoice.model";
import { 
  PurchaseInvoiceVendorFormValue, 
  PurchaseInvoiceFormValue, 
  PurchaseInvoicePropertiesFormValue, 
  PurchaseInvoiceSummaryFormValue, 
  PurchaseItemFormValue, 
  PurchaseItemTaxFormValue 
} from "./purchase-invoice-form.type";

export const mapPurchaseItemTaxFormValueToRequest = (formValue: PurchaseItemTaxFormValue): PurchaseInvoiceItemTaxRequest => {
  const name = formValue.name;
  const shortname = formValue.shortname;
  const rate = toNumber(formValue.rate?.replace('%', ''));
  const appliedto = toNumber(formValue.appliedto);
  const amount = toNumber(formValue.amount);
  const taxid = formValue.tax?.id;
  return {
    name,
    shortname,
    rate,
    appliedto,
    amount,
    ...(taxid ? { taxid } : {}),
  };
};

export const mapPurchaseItemFormValueToRequest = (formValue: PurchaseItemFormValue, order: number): PurchaseInvoiceItemRequest => {
  const item = formValue.item;
  const name = formValue.name ?? item.name;
  const displayname = formValue.displayname ?? item.displayname ?? item.name;
  const description = formValue.description ?? item.description;
  const code = formValue.code ?? item.code ?? item.category.code;
  const price = toNumber(formValue.price);
  const quantity = toNumber(formValue.quantity);
  const itemtotal = toNumber(formValue.itemtotal);
  const discpercent = toNumber(formValue.discpercent);
  const discamount = toNumber(formValue.discamount);
  const subtotal = toNumber(formValue.subtotal);
  const taxamount = toNumber(formValue.taxamount);
  const grandtotal = toNumber(formValue.grandtotal);
  const itemid = formValue.item.id!;
  const taxes = (formValue.taxes ?? []).map(tax => mapPurchaseItemTaxFormValueToRequest(tax));
  return {
    name,
    ...(description ? { description } : {}),
    ...(displayname ? { displayname } : {}),
    order,
    code,
    price,
    quantity,
    itemtotal,
    ...(discpercent ? { discpercent } : {}),
    ...(discamount ? { discamount } : {}),
    subtotal,
    ...(taxamount ? { taxamount } : {}),
    grandtotal,
    itemid,
    taxes,
  };
};

export const mapPurchaseInvoiceFormValueToRequest = (formValue: PurchaseInvoiceFormValue): PurchaseInvoiceRequest => {
  const number = formValue.properties.number;
  const date = convertToNodeDateFormat(formValue.properties.date);
  const duedate = convertToNodeDateFormat(formValue.properties.duedate);
  const itemtotal = toNumber(formValue.itemsDetails.summary.itemtotal);
  const discount = toNumber(formValue.itemsDetails.summary.discount);
  const subtotal = toNumber(formValue.itemsDetails.summary.subtotal);
  const tax = toNumber(formValue.itemsDetails.summary.tax);
  const roundoff = toNumber(formValue.itemsDetails.summary.roundoff);
  const grandtotal = toNumber(formValue.itemsDetails.summary.grandtotal);
  const currencycode = formValue.properties.currency.code;
  const vendoraddress = formValue.vendor.vendoraddress;
  const vendorid = formValue.vendor.vendor.id!;
  const taxoption = formValue.properties.taxoption;
  const showdiscount = formValue.itemsDetails.showDiscount;
  const showdescription = formValue.itemsDetails.showDescription;
  const sourcestate = formValue.properties.sourcestate;
  const items = formValue.itemsDetails.items.map((item, index) => mapPurchaseItemFormValueToRequest(item, index + 1));
  return {
    number,
    date,
    duedate,
    itemtotal,
    discount,
    subtotal,
    tax,
    ...(roundoff ? { roundoff } : {}),
    grandtotal,
    currencycode,
    vendoraddress,
    vendorid,
    items,
    cprops: {
      showdiscount,
      showdescription,
      taxoption,
      sourcestate,
    },
  };
};

const mapTaxes = (item: any): PurchaseItemTaxFormValue[] => {
  const taxes = Array.isArray(item?.taxes) ? item.taxes : [];
  return taxes.map((t: any): PurchaseItemTaxFormValue => ({
    rate: t?.rate ?? '',
    appliedto: toNumber(t?.appliedto),
    amount: toNumber(t?.amount),
    name: t?.name ?? '',
    shortname: t?.shortname ?? '',
    tax: t?.tax, // keep original domain object
  }));
};

const mapItem = (item: any, fractions: number): PurchaseItemFormValue => ({
  name: item?.name ?? item?.item?.name ?? '',
  displayname: item?.displayname ?? item?.item?.displayname ?? undefined,
  description: item?.description ?? undefined,
  code: item?.code ?? item?.item?.code ?? '',
  price: formatAmountToFraction(item?.price, fractions),
  quantity: formatAmountToFraction(item?.quantity, fractions),
  itemtotal: formatAmountToFraction(item?.itemtotal, fractions),
  discpercent: item?.discpercent ?? null,
  discamount: item?.discamount ?? null,
  subtotal: formatAmountToFraction(item?.subtotal, fractions),
  taxes: mapTaxes(item),
  taxamount: item?.taxamount ?? null,
  grandtotal: formatAmountToFraction(item?.grandtotal, fractions),
  item: item?.item, // keep original reference
});

const mapVendorBlock = (inv: PurchaseInvoice): PurchaseInvoiceVendorFormValue => {
  return {
    vendor: inv.vendor,
    vendoraddress: inv.vendoraddress,
  };
};

const mapSummary = (inv: PurchaseInvoice, fractions: number): PurchaseInvoiceSummaryFormValue => {
  const grandtotal = toNumber(inv?.grandtotal);
  return {
    itemtotal: formatAmountToFraction(inv?.itemtotal, fractions),
    discount: formatAmountToFraction(inv?.discount, fractions),
    subtotal: formatAmountToFraction(inv?.subtotal, fractions),
    tax: formatAmountToFraction(inv?.tax, fractions),
    roundoff: formatAmountToFraction(inv?.roundoff, fractions),
    grandtotal: formatAmountToFraction(grandtotal, fractions),
    words: formatAmountToWords(grandtotal, inv?.currency),
  };
};

const mapProperties = (inv: PurchaseInvoice): PurchaseInvoicePropertiesFormValue => ({
  number: inv.number,
  date: dayjs(inv.date).format(DEFAULT_NODE_DATE_FORMAT),
  duedate: dayjs(inv.duedate).format(DEFAULT_NODE_DATE_FORMAT),
  currency: inv.currency ?? inv.vendor.currency,
  taxoption: inv?.cprops?.taxoption ?? 'Intra State',
  sourcestate: inv?.cprops?.sourcestate ?? '',
  journal: inv?.sprops?.journal ?? '',
});


export function purchaseInvoiceModelToPurchaseInvoiceFormValue(inv: PurchaseInvoice): PurchaseInvoiceFormValue {
  return {
    vendor: mapVendorBlock(inv),
    properties: mapProperties(inv),
    itemsDetails: {
      showDiscount: inv?.cprops?.showdiscount ?? false,
      showDescription: inv?.cprops?.showdescription ?? false,
      items: Array.isArray(inv?.items) ? inv.items!.map(mapItem) : [],
      summary: mapSummary(inv, inv?.currency?.minorunit ?? TWO),
    },
  };
}

