# Installed on ir.cron "Employee: Birthday Reminders" (hr.employee).
# Sends a real outgoing email (mail.mail) to the employee's own address.
# No model/res_id, so Odoo does not drop a chatter note or internal notification.

template = env.ref(
    'trade_and_support_toolkit.email_template_birthday_greeting',
    raise_if_not_found=False,
)
if not template:
    template = env['mail.template'].sudo().browse(99)
if not template or not template.exists():
    log('Birthday greeting template missing', level='warning')
else:
    calendar = env.company.resource_calendar_id
    tzname = (calendar.tz if calendar else False) or env.user.tz or 'Asia/Muscat'
    try:
        today = datetime.datetime.now(timezone(tzname)).date()
    except Exception:
        today = datetime.date.today()
    year_start = '%s-01-01 00:00:00' % today.year
    # ponytail: one pass over employees with a birthday; fine at this headcount.
    # Upgrade path is a stored month/day field if the directory gets large.
    employees = model.search([('active', '=', True), ('birthday', '!=', False)])
    for employee in employees:
        birthday = employee.birthday
        if not birthday:
            continue
        due = birthday.month == today.month and birthday.day == today.day
        if (
            not due
            and birthday.month == 2
            and birthday.day == 29
            and today.month == 2
            and today.day == 28
        ):
            # Feb 29 birthdays are greeted on Feb 28 when that year has no Feb 29.
            year = today.year
            leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
            due = not leap
        if not due:
            continue
        contact = employee.work_contact_id
        email = (
            employee.work_email
            or employee.private_email
            or (contact.email if contact else False)
            or ''
        )
        email = (email or '').strip()
        if '@' not in email:
            log(
                'Birthday email skipped, no valid address for %s' % employee.display_name,
                level='warning',
            )
            continue
        rendered = template._generate_template(
            [employee.id], ['subject', 'body_html', 'email_from']
        )
        vals = rendered.get(employee.id) or {}
        subject = vals.get('subject') or ('Happy Birthday %s!' % employee.name)
        already = env['mail.mail'].sudo().search_count([
            ('email_to', '=', email),
            ('subject', '=', subject),
            ('create_date', '>=', year_start),
            ('state', 'in', ['outgoing', 'sent']),
        ])
        if already:
            continue
        company = employee.company_id or env.company
        email_from = (
            vals.get('email_from')
            or company.partner_id.email_formatted
            or company.email
            or False
        )
        mail = env['mail.mail'].sudo().create({
            'subject': subject,
            'body_html': vals.get('body_html') or '',
            'email_from': email_from,
            'email_to': email,
            'auto_delete': False,
        })
        mail.send()
        log(
            'Birthday email queued for %s (mail %s)' % (employee.display_name, mail.id)
        )
