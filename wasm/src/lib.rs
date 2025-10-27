use wasm_bindgen::prelude::*;

fn sanitize_numeric_input(input: &str) -> String {
    input
        .chars()
        .filter(|c| c.is_ascii_digit() || matches!(c, ',' | '.' | '-'))
        .collect()
}

fn has_decimal(input: &str, marker: char) -> bool {
    if let Some(pos) = input.rfind(marker) {
        let decimals = &input[pos + marker.len_utf8()..];
        let count = decimals.chars().count();
        if !(1..=2).contains(&count) {
            return false;
        }
        decimals.chars().all(|c| c.is_ascii_digit())
    } else {
        false
    }
}

fn normalize_number(input: &str) -> Option<String> {
    if input.is_empty() {
        return None;
    }

    let has_comma = has_decimal(input, ',');
    let has_dot = has_decimal(input, '.');

    let normalized = if has_comma {
        input.replace('.', "").replace(',', ".")
    } else if has_dot {
        input.replace(',', "")
    } else {
        input.replace(['.', ','], "")
    };

    if normalized.trim().is_empty() {
        None
    } else {
        Some(normalized)
    }
}

fn parse_normalized_f64(value: &str) -> f64 {
    match value.parse::<f64>() {
        Ok(number) if number.is_finite() => number,
        _ => f64::NAN,
    }
}

#[wasm_bindgen]
pub fn to_numeric_value(text: &str) -> f64 {
    let sanitized = sanitize_numeric_input(text);
    match normalize_number(&sanitized) {
        Some(normalized) => parse_normalized_f64(&normalized),
        None => f64::NAN,
    }
}

#[wasm_bindgen]
pub fn parse_amount_input(value: &str) -> f64 {
    let numeric = to_numeric_value(value);
    if numeric.is_finite() {
        numeric
    } else {
        f64::NAN
    }
}

#[wasm_bindgen]
pub fn calculate_total(amount: f64, rate: f64) -> f64 {
    if amount.is_finite() && rate.is_finite() {
        amount * rate
    } else {
        f64::NAN
    }
}

#[wasm_bindgen]
pub fn determine_trend(previous: f64, current: f64) -> i32 {
    if !current.is_finite() || !previous.is_finite() {
        0
    } else if current > previous {
        1
    } else if current < previous {
        -1
    } else {
        0
    }
}
