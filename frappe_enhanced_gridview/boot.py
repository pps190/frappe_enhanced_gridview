import frappe


def add_bootinfo(bootinfo):
	"""
	Example:
	frappe_enhanced_gridview = {
		"Contact Email": [
			("Contact", "emails"),
		]
	}
	"""
	bootinfo.frappe_enhanced_gridview = frappe.get_hooks("frappe_enhanced_gridview") or None
