import { SaleInvoiceFormValue, SaleItemFormValue, SaleItemTaxFormValue } from "./sale-invoice-form.type";
import { SaleInvoiceItemRequest, SaleInvoiceItemTaxRequest, SaleInvoiceRequest } from "../../../store/sale-invoice/sale-invoice-request.type";
import { toNumber } from "../../../../../../util/currency.util";
import { convertToNodeDateFormat } from "../../../../../../util/date.util";

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
  };
};