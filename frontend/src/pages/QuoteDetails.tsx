import React, { useState, useEffect } from 'react';
import { quoteService, bookingService } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

interface QuoteDetailsProps {
  quoteId: number;
  onBack: () => void;
  onBookingConfirmed: () => void;
  onReviseQuote?: (quoteData: any) => void;
}

const QuoteDetails: React.FC<QuoteDetailsProps> = ({ quoteId, onBack, onBookingConfirmed, onReviseQuote }) => {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailStatusMsg, setEmailStatusMsg] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const data = await quoteService.getById(quoteId);
        setQuote(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading quote details.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    try {
      setBookingLoading(true);
      await quoteService.updateStatus(quoteId, status);
      
      if (status === 'approved') {
        // Automatically create a booking upon approval
        await bookingService.create(quoteId);
        onBookingConfirmed();
      } else {
        // Just reload quote status
        const data = await quoteService.getById(quoteId);
        setQuote(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating quote status.');
    } finally {
      setBookingLoading(false);
    }
  };

  const generatePDF = () => {
    if (!quote) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Palette Definition (Navy & Slate Theme)
    const primaryColor = [15, 23, 42]; // Slate 950
    const accentColor = [99, 102, 241]; // Indigo 500
    
    // Page border
    doc.setDrawColor(241, 245, 249);
    doc.line(10, 10, 200, 10);
    doc.line(10, 287, 200, 287);
    doc.line(10, 10, 10, 287);
    doc.line(200, 10, 200, 287);

    // Title / Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ONE POINT SOLUTIONS", 15, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("EVENT TECHNOLOGY RENTAL BUNDLE ESTIMATE", 15, 30);

    // Company Contact Metadata (Right Aligned)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("One Point Solutions LLC", 195, 20, { align: 'right' });
    doc.text("Technology Rentals & Optimization", 195, 24, { align: 'right' });
    doc.text("support@onepoint.com | www.onepoint.com", 195, 28, { align: 'right' });

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);

    // Invoice Meta (Left side)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`QUOTE ESTIMATE: #OPS-2026-${quote.id}`, 15, 43);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date Issued: ${new Date(quote.created_at).toLocaleDateString()}`, 15, 48);
    doc.text(`Estimated By: One Point Solutions Catalog Cart`, 15, 53);

    // Client Meta (Right side)
    doc.setFont("helvetica", "bold");
    doc.text("PREPARED FOR:", 120, 43);
    doc.setFont("helvetica", "normal");
    doc.text(`Client Name: ${quote.username}`, 120, 48);
    doc.text(`Client Email: ${quote.user_email || 'client@onepoint.com'}`, 120, 53);

    // Event Info Section Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 60, 180, 22, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 60, 180, 22, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Event: ${quote.event_name} (${quote.event_type})`, 18, 65);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dates: ${new Date(quote.start_date).toLocaleDateString()} to ${new Date(quote.end_date).toLocaleDateString()}`, 18, 70);
    doc.text(`Venue Size: ${quote.venue_size.toUpperCase()} | Attendees: ${quote.attendees}`, 18, 75);

    if (quote.special_requirements) {
      doc.text(`Notes: ${quote.special_requirements.substring(0, 75)}...`, 120, 70);
    }

    // Table of equipment items
    const tableHeaders = [["#", "Equipment Item", "Category", "Qty Required", "Daily Rate", "Total Cost"]];
    const tableBody = quote.bundle_details.map((item: any, idx: number) => [
      idx + 1,
      item.name,
      item.category,
      item.quantity,
      `Rs. ${parseFloat(item.daily_rate).toLocaleString('en-IN')}`,
      `Rs. ${parseFloat(item.total_price).toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableBody,
      startY: 88,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      styles: {
        fontSize: 8,
        font: 'helvetica'
      }
    });

    // Summary calculation (Positioned relative to end of table)
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", 145, finalY, { align: 'right' });
    doc.text(`Rs. ${parseFloat(quote.subtotal).toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });

    if (parseFloat(quote.discount) > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94); // Green-500
      doc.text("Bundle Discount:", 145, finalY + 5, { align: 'right' });
      doc.text(`-Rs. ${parseFloat(quote.discount).toLocaleString('en-IN')}`, 195, finalY + 5, { align: 'right' });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Total Estimate:", 145, finalY + 12, { align: 'right' });
    doc.text(`Rs. ${parseFloat(quote.total).toLocaleString('en-IN')}`, 195, finalY + 12, { align: 'right' });

    // Terms and Signatures
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TERMS AND CONDITIONS:", 15, finalY + 25);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("1. All hardware availability is checked in real-time. Estimate is valid for 14 days.", 15, finalY + 30);
    doc.text("2. Cancellations made less than 48 hours prior to delivery may incur a 20% restocking fee.", 15, finalY + 34);
    doc.text("3. Setup support and operations logistics will be scheduled upon booking approval.", 15, finalY + 38);

    const fileName = `Quote_Estimate_OPS_${quote.id}.pdf`;
    doc.save(fileName);

    // Trigger email sending
    const triggerEmail = async () => {
      try {
        setEmailStatus('sending');
        setEmailStatusMsg('');
        setEmailPreviewUrl('');

        const pdfDataUri = doc.output('datauristring');
        const base64Data = pdfDataUri.split(',')[1];

        const response = await quoteService.sendEmail(quote.id, {
          pdfBase64: base64Data,
          fileName: fileName
        });

        setEmailStatus('success');
        if (response.previewUrl) {
          setEmailPreviewUrl(response.previewUrl);
          console.log(`Email Preview URL: ${response.previewUrl}`);
        }
      } catch (err: any) {
        console.error('Failed to send quote email', err);
        setEmailStatus('error');
        setEmailStatusMsg(err.response?.data?.message || 'Error occurred while sending email.');
      }
    };

    triggerEmail();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
    }
  };

  const getDurationDays = () => {
    if (!quote) return 0;
    const d1 = new Date(quote.start_date);
    const d2 = new Date(quote.end_date);
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error || 'Failed to load quote details.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </button>
      </div>

      {/* Email Status Indicator */}
      {emailStatus !== 'idle' && (
        <div className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
          emailStatus === 'sending' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
          emailStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
          'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-center space-x-2">
            {emailStatus === 'sending' && (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 flex-shrink-0"></div>
            )}
            {emailStatus === 'success' && (
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
            {emailStatus === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <div>
              {emailStatus === 'sending' && <p className="font-semibold">Sending quotation email copy...</p>}
              {emailStatus === 'success' && (
                <div>
                  <p className="font-semibold">📧 Quotation email sent successfully to: <span className="underline">{quote.user_email || 'client@onepoint.com'}</span></p>
                  <p className="text-[11px] text-emerald-600/80 mt-0.5">Please check your inbox (and spam folder) for the confirmation.</p>
                </div>
              )}
              {emailStatus === 'error' && <p className="font-semibold">⚠️ Failed to send quotation email: {emailStatusMsg}</p>}
            </div>
          </div>
          {emailStatus === 'success' && emailPreviewUrl && (
            <a 
              href={emailPreviewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider inline-flex items-center space-x-1 transition-colors self-start md:self-auto cursor-pointer"
            >
              <span>View Ethereal Email</span>
            </a>
          )}
        </div>
      )}

      {/* Invoice Card Container */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-105 pb-8">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-extrabold text-slate-900">QUOTE ESTIMATE: #OPS-2026-{quote.id}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Generated: {new Date(quote.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize tracking-wide ${getStatusStyle(quote.status)}`}>
              {quote.status}
            </span>
            <button
              onClick={generatePDF}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Client & Event Specs Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Client Details</h4>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p>Username: <strong className="text-slate-800">@{quote.username}</strong></p>
              <p>Email: <strong className="text-slate-800">{quote.user_email || 'client@onepoint.com'}</strong></p>
              <p>Issuer: <strong className="text-slate-600">One Point Solutions</strong></p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Event Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Dates</p>
                  <p className="text-slate-800">{new Date(quote.start_date).toLocaleDateString()} - {new Date(quote.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Attendees</p>
                  <p className="text-slate-800">{quote.attendees} People</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Venue size</p>
                  <p className="capitalize text-slate-800">{quote.venue_size}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Rent Duration</p>
                  <p className="text-slate-800">{getDurationDays()} Days</p>
                </div>
              </div>
            </div>
          </div>

          {quote.special_requirements && (
            <div className="md:col-span-2 space-y-1.5 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Special Notes & Requirements</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {quote.special_requirements}
              </p>
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="py-8">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-4">Itemized Rental Pricing</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Equipment Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quote.bundle_details && quote.bundle_details.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">₹{parseFloat(item.daily_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">₹{parseFloat(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Financial calculations */}
        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="text-xs text-slate-500 max-w-sm leading-relaxed">
            <p className="font-semibold text-slate-600 mb-1 uppercase tracking-wider">Estimate Validity & Terms</p>
            <p>This estimate has been generated by the One Point Solutions heuristic optimization system. Hardware availability is guaranteed if booked within 14 days of creation.</p>
          </div>

          <div className="w-full sm:w-80 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{parseFloat(quote.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {parseFloat(quote.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Bundle Discount:</span>
                <span>-₹{parseFloat(quote.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-100">
              <span>Grand Total:</span>
              <span className="text-2xl text-emerald-600 font-bold">₹{parseFloat(quote.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Customer Interaction buttons */}
        {quote.status === 'draft' && (
          <div className="mt-12 pt-8 border-t border-slate-105 space-y-6">
            {showRejectOptions ? (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider">Revise or Cancel Estimate?</h4>
                  <p className="text-xs text-slate-600 mt-1">Would you like to cancel this quote estimate completely, or edit the quantities to create a revised quote?</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={bookingLoading}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Confirm Direct Rejection
                  </button>
                  <button
                    onClick={() => {
                      if (onReviseQuote) {
                        onReviseQuote(quote);
                      }
                    }}
                    disabled={bookingLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Edit & Revise Items
                  </button>
                  <button
                    onClick={() => setShowRejectOptions(false)}
                    disabled={bookingLoading}
                    className="bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  onClick={() => setShowRejectOptions(true)}
                  disabled={bookingLoading}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold px-6 py-3 rounded-xl transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Estimate</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={bookingLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{bookingLoading ? 'Securing Booking...' : 'Approve & Confirm Booking'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteDetails;

