package com.hrapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.hrapp.R
import com.hrapp.data.AttendanceLog
import java.text.SimpleDateFormat
import java.util.*

class AttendanceAdapter(private val logs: List<AttendanceLog>) :
    RecyclerView.Adapter<AttendanceAdapter.ViewHolder>() {

    private val inputFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
    private val outputFmt = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvDate: TextView = view.findViewById(R.id.tvDate)
        val tvPunchIn: TextView = view.findViewById(R.id.tvPunchIn)
        val tvPunchOut: TextView = view.findViewById(R.id.tvPunchOut)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        ViewHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_attendance, parent, false))

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val log = logs[position]
        val punchIn = try { outputFmt.format(inputFmt.parse(log.punch_in_time)!!) } catch (e: Exception) { log.punch_in_time }
        holder.tvDate.text = punchIn.split(",")[0]
        holder.tvPunchIn.text = "In: $punchIn"
        if (log.punch_out_time != null) {
            val punchOut = try { outputFmt.format(inputFmt.parse(log.punch_out_time)!!) } catch (e: Exception) { log.punch_out_time }
            holder.tvPunchOut.text = "Out: $punchOut"
            holder.tvStatus.text = "Completed"
            holder.tvStatus.setTextColor(holder.itemView.context.getColor(android.R.color.holo_green_dark))
        } else {
            holder.tvPunchOut.text = "Out: --"
            holder.tvStatus.text = "Active"
            holder.tvStatus.setTextColor(holder.itemView.context.getColor(android.R.color.holo_orange_dark))
        }
    }

    override fun getItemCount() = logs.size
}
