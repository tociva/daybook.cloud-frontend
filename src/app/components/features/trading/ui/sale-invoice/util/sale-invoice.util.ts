import { SaleInvoiceCustomerFormValue, SaleInvoiceFormValue, SaleInvoicePropertiesFormValue, SaleInvoiceSummaryFormValue, SaleInvoiceTaxDisplayModeType, SaleItemFormValue, SaleItemTaxFormValue } from "./sale-invoice-form.type";
import { SaleInvoiceItemRequest, SaleInvoiceItemTaxRequest, SaleInvoiceRequest } from "../../../store/sale-invoice/sale-invoice-request.type";
import { formatAmountToFraction, formatAmountToWords, toNumber } from "../../../../../../util/currency.util";
import { convertToNodeDateFormat } from "../../../../../../util/date.util";
import { SaleInvoice } from "../../../store/sale-invoice/sale-invoice.model";
import { DEFAULT_NODE_DATE_FORMAT, TWO } from "../../../../../../util/constants";
import dayjs from "dayjs";
import { SaleItem } from "../../../store/sale-invoice/sale-item.model";

export const mapSaleItemTaxFormValueToRequest = (formValue: SaleItemTaxFormValue): SaleInvoiceItemTaxRequest => {
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
export const mapSaleItemFormValueToRequest = (formValue: SaleItemFormValue, order: number): SaleInvoiceItemRequest => {
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
  const taxes = formValue.taxes.map(tax => mapSaleItemTaxFormValueToRequest(tax));
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

export const mapSaleInvoiceFormValueToRequest = (formValue: SaleInvoiceFormValue): SaleInvoiceRequest => {
  const number = formValue.properties.number;
  const isAutoNumbering = formValue.properties.autoNumbering;
  const date = convertToNodeDateFormat(formValue.properties.date);
  const duedate = convertToNodeDateFormat(formValue.properties.duedate);
  const itemtotal = toNumber(formValue.summary.itemtotal);
  const discount = toNumber(formValue.summary.discount);
  const subtotal = toNumber(formValue.summary.subtotal);
  const tax = toNumber(formValue.summary.tax);
  const roundoff = toNumber(formValue.summary.roundoff);
  const grandtotal = toNumber(formValue.summary.grandtotal);
  const currencycode = formValue.properties.currency.code;
  const billingaddress = formValue.customer.billingaddress;
  const shippingaddress = formValue.customer.shippingaddress;
  const customerid = formValue.customer.customer.id!;
  const taxoption = formValue.properties.taxoption;
  const taxdisplaymode = formValue.taxDisplayMode;
  const showdiscount = formValue.showDiscount;
  const showdescription = formValue.showDescription;
  const usebillingforshipping = formValue.customer.usebillingforshipping;
  const deliverystate = formValue.properties.deliverystate;
  const items = formValue.items.map((item, index) => mapSaleItemFormValueToRequest(item, index + 1));
  return {
    ...(!isAutoNumbering ? { number } : {}),
    date,
    duedate,
    itemtotal,
    discount,
    subtotal,
    tax,
    ...(roundoff ? { roundoff } : {}),
    grandtotal,
    currencycode,
    billingaddress,
    shippingaddress,
    customerid,
    items,
    cprops: {
      taxdisplaymode,
      showdiscount,
      showdescription,
      usebillingforshipping,
      taxoption,
      deliverystate,
    },
  };
};


export const findTaxColumnCount = (taxDisplayMode: SaleInvoiceTaxDisplayModeType): number => {
  if([SaleInvoiceTaxDisplayModeType.IGST].includes(taxDisplayMode)) {
    return 1;
  }else if([SaleInvoiceTaxDisplayModeType.CGST_SGST, SaleInvoiceTaxDisplayModeType.IGST_CESS].includes(taxDisplayMode)) {
    return 2;
  }else if([SaleInvoiceTaxDisplayModeType.CGST_SGST_CESS].includes(taxDisplayMode)) {
    return 3;
  }
  return 0;
}

type Maybe<T> = T | null | undefined;

const eqAddress = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  // shallow compare common address fields if present
  const keys = ['line1','line2','city','state','postalCode','country'];
  return keys.every(k => (a?.[k] ?? '') === (b?.[k] ?? ''));
};

const mapTaxes = (item: any): SaleItemTaxFormValue[] => {
  const taxes = Array.isArray(item?.taxes) ? item.taxes : [];
  return taxes.map((t: any): SaleItemTaxFormValue => ({
    rate: toNumber(t?.rate),
    appliedto: toNumber(t?.appliedto),
    amount: toNumber(t?.amount),
    name: t?.name ?? '',
    shortname: t?.shortname ?? '',
    tax: t?.tax, // keep original domain object
  }));
};

const mapItem = (item: any, fractions: number): SaleItemFormValue => ({
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

const mapCustomerBlock = (inv: SaleInvoice): SaleInvoiceCustomerFormValue => {
  const usebillingforshipping =
    (inv?.cprops?.usebillingforshipping ?? eqAddress(inv?.billingaddress, inv?.shippingaddress)) || false;

  return {
    customer: inv.customer,
    billingaddress: inv.billingaddress,
    shippingaddress: usebillingforshipping ? inv.billingaddress : inv.shippingaddress,
    usebillingforshipping: usebillingforshipping,
  };
};

const mapSummary = (inv: SaleInvoice, fractions: number): SaleInvoiceSummaryFormValue => {
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

/**
 * NOTE: This assumes you already have a SaleInvoicePropertiesFormValue type defined elsewhere.
 * If its shape differs, adjust the object below to match your project’s definition.
 */
const mapProperties = (inv: SaleInvoice): SaleInvoicePropertiesFormValue => ({
  number: inv.number,
  date: dayjs(inv.date).format(DEFAULT_NODE_DATE_FORMAT),
  duedate: dayjs(inv.duedate).format(DEFAULT_NODE_DATE_FORMAT),
  currency: inv.currency,
  taxoption: inv?.cprops?.taxoption ?? 'Intra State',
  deliverystate: inv?.cprops?.deliverystate ?? '',
  autoNumbering: inv?.cprops?.autoNumbering ?? false,
  journal: inv?.sprops?.journal ?? '',
});


export function saleInvoiceModelToSaleInvoiceFormValue(inv: SaleInvoice): SaleInvoiceFormValue {
  return {
    taxDisplayMode: inv?.cprops?.taxdisplaymode ?? SaleInvoiceTaxDisplayModeType.CGST_SGST, // fallback to your app’s default
    showDiscount: inv?.cprops?.showdiscount ?? false,
    showDescription: inv?.cprops?.showdescription ?? false,
    customer: mapCustomerBlock(inv),
    properties: mapProperties(inv),
    items: Array.isArray(inv?.items) ? inv.items!.map(mapItem) : [],
    summary: mapSummary(inv, inv?.currency?.minorunit ?? TWO),
  };
}
