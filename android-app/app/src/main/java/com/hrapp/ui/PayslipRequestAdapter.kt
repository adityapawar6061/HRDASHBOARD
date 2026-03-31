package com.hrapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.hrapp.R
import com.hrapp.data.PayslipRequest

class PayslipRequestAdapter(private val items: List<PayslipRequest>) :
    RecyclerView.Adapter<PayslipRequestAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val tvMonth: TextView = view.findViewById(R.id.tvMonth)
        val tvRequestedAt: TextView = view.findViewById(R.id.tvRequestedAt)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(LayoutInflater.from(parent.context).inflate(R.layout.item_payslip_request, parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        holder.tvMonth.text = item.month
        holder.tvRequestedAt.text = "Requested: ${item.requested_at.take(10)}"
        holder.tvStatus.text = item.status.uppercase()
        val color = when (item.status) {
            "approved" -> 0xFF16A34A.toInt()
            "rejected" -> 0xFFDC2626.toInt()
            else -> 0xFFD97706.toInt()
        }
        holder.tvStatus.setTextColor(color)
    }

    override fun getItemCount() = items.size
}
