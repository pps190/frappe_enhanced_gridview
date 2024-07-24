import GridRow from './grid_row';
import Grid from './grid';

class Custom_GridRow extends GridRow {
    
    validate_columns_width() {
		let total_column_width = 0.0;

		this.selected_columns_for_grid.forEach((row) => {
			if (row.columns && row.columns > 0) {
				total_column_width += cint(row.columns);
			}
		});

		// if (total_column_width && total_column_width > 10) {
		// 	frappe.throw(__("The total column width cannot be more than 10."));
		// }
	}
}


class Custom_Grid extends Grid {

    make_head() {
		if (this.prevent_build) return;

		// labels
		if (this.header_row) {
			$(this.parent).find(".grid-heading-row .grid-row").remove();
		}
        // implement custom class
		this.header_row = new Custom_GridRow({
			parent: $(this.parent).find(".grid-heading-row"),
			parent_df: this.df,
			docfields: this.docfields,
			frm: this.frm,
			grid: this,
			configure_columns: true,
		});
        // implement custom class
		this.header_search = new Custom_GridRow({
			parent: $(this.parent).find(".grid-heading-row"),
			parent_df: this.df,
			docfields: this.docfields,
			frm: this.frm,
			grid: this,
			show_search: true,
		});
		this.header_search.row.addClass("filter-row");
		if (this.header_search.show_search || this.header_search.show_search_row()) {
			$(this.parent).find(".grid-heading-row").addClass("with-filter");
		} else {
			$(this.parent).find(".grid-heading-row").removeClass("with-filter");
		}

		this.filter_applied && this.update_search_columns();
	}

    render_result_rows($rows, append_row) {
		let result_length = this.grid_pagination.get_result_length();
		let page_index = this.grid_pagination.page_index;
		let page_length = this.grid_pagination.page_length;
		if (!this.grid_rows) {
			return;
		}
		for (var ri = (page_index - 1) * page_length; ri < result_length; ri++) {
			var d = this.data[ri];
			if (!d) {
				return;
			}
			if (d.idx === undefined) {
				d.idx = ri + 1;
			}
			if (d.name === undefined) {
				d.name = "row " + d.idx;
			}
			let grid_row;
			if (this.grid_rows[ri] && !append_row) {
				grid_row = this.grid_rows[ri];
				grid_row.doc = d;
				grid_row.refresh();
			} else {
                // implement custom class
				grid_row = new Custom_GridRow({
					parent: $rows,
					parent_df: this.df,
					docfields: this.docfields,
					doc: d,
					frm: this.frm,
					grid: this,
				});
				this.grid_rows[ri] = grid_row;
			}

			this.grid_rows_by_docname[d.name] = grid_row;
		}
	}

	setup_visible_columns() {
		if (this.visible_columns && this.visible_columns.length > 0) return;
	
		this.user_defined_columns = [];
		this.setup_user_defined_columns();
		var total_colsize = 1,
			fields =
				this.user_defined_columns && this.user_defined_columns.length > 0
					? this.user_defined_columns
					: this.editable_fields || this.docfields;
	
		this.visible_columns = [];
	
		for (var ci in fields) {
			var _df = fields[ci];
	
			// get docfield if from fieldname
			df =
				this.user_defined_columns && this.user_defined_columns.length > 0
					? _df
					: this.fields_map[_df.fieldname];
	
			if (
				df &&
				!df.hidden &&
				(this.editable_fields || df.in_list_view) &&
				((this.frm && this.frm.get_perm(df.permlevel, "read")) || !this.frm) &&
				!frappe.model.layout_fields.includes(df.fieldtype)
			) {
				if (df.columns) {
					df.colsize = df.columns;
				} else {
					this.update_default_colsize(df);
				}
	
				// attach formatter on refresh
				if (
					df.fieldtype == "Link" &&
					!df.formatter &&
					df.parent &&
					frappe.meta.docfield_map[df.parent]
				) {
					const docfield = frappe.meta.docfield_map[df.parent][df.fieldname];
					if (docfield && docfield.formatter) {
						df.formatter = docfield.formatter;
					}
				}
	
				total_colsize += df.colsize;
				if (total_colsize > 100) return false; // Increased limit to 20
				this.visible_columns.push([df, df.colsize]);
			}
		}
	
		// redistribute if total-col size is less than 12
		var passes = 0;
		while (total_colsize < 100 && passes < 100) { // Adjusted loop conditions
			for (var i in this.visible_columns) {
				var df = this.visible_columns[i][0];
				var colsize = this.visible_columns[i][1];
				if (colsize > 1 && colsize < 20 && frappe.model.is_non_std_field(df.fieldname)) {
					if (
						passes < 3 &&
						["Int", "Currency", "Float", "Check", "Percent"].indexOf(df.fieldtype) !==
							-1
					) {
						// don't increase col size of these fields in first 3 passes
						continue;
					}
	
					this.visible_columns[i][1] += 1;
					total_colsize++;
				}
	
				if (total_colsize > 100) break;
			}
			passes++;
		}
	
		
	}
}


frappe.ui.form.ControlTable = class CustomControlTable extends frappe.ui.form.ControlTable {
    make() {
		super.make();

        // add title if prev field is not column / section heading or html
		this.grid = new Custom_Grid({
			frm: this.frm,
			df: this.df,
			parent: this.wrapper,
			control: this,
		});
    }

}