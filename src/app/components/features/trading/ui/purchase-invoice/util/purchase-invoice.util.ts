import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT, TWO } from "../../../../../../util/constants";
import { formatAmountToFraction, formatAmountToWords, toNumber } from "../../../../../../util/currency.util";
import { convertToNodeDateFormat } from "../../../../../../util/date.util";
import { PurchaseInvoiceItemRequest, PurchaseInvoiceItemTaxRequest, PurchaseInvoiceRequest } from "../../../store/purchase-invoice/purchase-invoice-request.type";
import { PurchaseInvoice } from "../../../store/purchase-invoice/purchase-invoice.model";
import { PurchaseInvoiceVendorFormValue, PurchaseInvoiceFormValue, PurchaseInvoicePropertiesFormValue, PurchaseInvoiceSummaryFormValue, PurchaseInvoiceTaxDisplayModeType, PurchaseItemFormValue, PurchaseItemTaxFormValue } from "./purchase-invoice-form.type";

export const mapPurchaseItemTaxFormValueToRequest = (formValue: PurchaseItemTaxFormValue): PurchaseInvoiceItemTaxRequest => {
  const name = formValue.name;
  const shortname = formValue.shortname;
  const rate = toNumber(formValue.rate);
  const appliedto = toNumber(formValue.appliedto);
  const amount = toNumber(formValue.amount);
  const taxid = formValue.tax.id!;
  return {
    name,
    shortname,
    rate,
    appliedto,
    amount,
    taxid,
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
  const taxes = formValue.taxes.map(tax => mapPurchaseItemTaxFormValueToRequest(tax));
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
  const itemtotal = toNumber(formValue.summary.itemtotal);
  const discount = toNumber(formValue.summary.discount);
  const subtotal = toNumber(formValue.summary.subtotal);
  const tax = toNumber(formValue.summary.tax);
  const roundoff = toNumber(formValue.summary.roundoff);
  const grandtotal = toNumber(formValue.summary.grandtotal);
  const currencycode = formValue.properties.currency.code;
  const vendorid = formValue.vendor.vendor.id!;
  const taxoption = formValue.properties.taxoption;
  const taxdisplaymode = formValue.taxDisplayMode;
  const showdiscount = formValue.showDiscount;
  const showdescription = formValue.showDescription;
  const items = formValue.items.map((item, index) => mapPurchaseItemFormValueToRequest(item, index + 1));
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
    vendorid,
    items,
    cprops: {
      taxdisplaymode,
      showdiscount,
      showdescription,
      taxoption,
    },
  };
};

export const findTaxColumnCount = (taxDisplayMode: PurchaseInvoiceTaxDisplayModeType): number => {
  if([PurchaseInvoiceTaxDisplayModeType.IGST].includes(taxDisplayMode)) {
    return 1;
  }else if([PurchaseInvoiceTaxDisplayModeType.CGST_SGST, PurchaseInvoiceTaxDisplayModeType.IGST_CESS].includes(taxDisplayMode)) {
    return 2;
  }else if([PurchaseInvoiceTaxDisplayModeType.CGST_SGST_CESS].includes(taxDisplayMode)) {
    return 3;
  }
  return 0;
}

type Maybe<T> = T | null | undefined;

const eqAddress = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  const keys = ['line1','line2','city','state','postalCode','country'];
  return keys.every(k => (a?.[k] ?? '') === (b?.[k] ?? ''));
};

const mapTaxes = (item: any): PurchaseItemTaxFormValue[] => {
  const taxes = Array.isArray(item?.taxes) ? item.taxes : [];
  return taxes.map((t: any): PurchaseItemTaxFormValue => ({
    rate: toNumber(t?.rate),
    appliedto: toNumber(t?.appliedto),
    amount: toNumber(t?.amount),
    name: t?.name ?? '',
    shortname: t?.shortname ?? '',
    tax: t?.tax,
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
  item: item?.item,
});

const mapVendorBlock = (inv: PurchaseInvoice): PurchaseInvoiceVendorFormValue => {
  return {
    vendor: inv.vendor,
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
  currency: inv.currency,
  taxoption: inv?.cprops?.taxoption ?? 'Intra State',
  journal: inv?.sprops?.journal ?? '',
});

export function purchaseInvoiceModelToPurchaseInvoiceFormValue(inv: PurchaseInvoice): PurchaseInvoiceFormValue {
  return {
    taxDisplayMode: inv?.cprops?.taxdisplaymode ?? PurchaseInvoiceTaxDisplayModeType.CGST_SGST,
    showDiscount: inv?.cprops?.showdiscount ?? false,
    showDescription: inv?.cprops?.showdescription ?? false,
    vendor: mapVendorBlock(inv),
    properties: mapProperties(inv),
    items: Array.isArray(inv?.items) ? inv.items!.map(mapItem) : [],
    summary: mapSummary(inv, inv?.currency?.minorunit ?? TWO),
  };
}

