import csv
import json

def check_risks(csv_file_path):
    """
    Analyze CSV data to identify risks based on completion status and keywords.
    
    Args:
        csv_file_path (str): Path to the CSV file containing task data
        
    Returns:
        list: List of dictionaries containing flagged items
    """
    # Risk keywords to look for in notes
    risk_keywords = ["assumed", "unverified", "no one responded", "outdated", 
                     "waiting", "unclear", "didn't know", "missed", "skipped"]
    
    # List to store flagged items
    flagged_items = []
    
    try:
        with open(csv_file_path, 'r') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            
            for row in csv_reader:
                risk_level = None
                
                # Check if task is not completed
                if row.get('Task_Completed', '').lower() == 'no':
                    risk_level = 'high'
                
                # Check for risk keywords in notes
                notes = row.get('Notes', '').lower()
                for keyword in risk_keywords:
                    if keyword.lower() in notes:
                        # If already high risk, keep it high
                        risk_level = 'high' if risk_level == 'high' else 'medium'
                
                # If we found a risk, add it to our flagged items
                if risk_level:
                    flagged_items.append({
                        'department': row.get('Department', 'Unknown'),
                        'task': row.get('Task', 'Unknown'),
                        'risk_level': risk_level,
                        'notes': row.get('Notes', '')
                    })
        
        return flagged_items
    
    except Exception as e:
        print(f"Error processing CSV file: {e}")
        return []

def output_results(flagged_items, output_format='json'):
    """
    Output the flagged items in the specified format.
    
    Args:
        flagged_items (list): List of dictionaries containing flagged items
        output_format (str): Format to output the results ('json' or 'list')
        
    Returns:
        str: Formatted output of flagged items
    """
    if output_format.lower() == 'json':
        return json.dumps(flagged_items, indent=2)
    else:
        # Simple list format
        result = []
        for item in flagged_items:
            result.append(f"Department: {item['department']}")
            result.append(f"Task: {item['task']}")
            result.append(f"Risk Level: {item['risk_level']}")
            result.append(f"Notes: {item['notes']}")
            result.append("-" * 40)
        return "\n".join(result)

def main():
    # Example usage
    csv_file_path = 'payroll_launch_tasks.csv'
    flagged_items = check_risks(csv_file_path)
    
    # Output as JSON
    json_output = output_results(flagged_items, 'json')
    with open('risk_results.json', 'w') as f:
        f.write(json_output)
    
    # Output as simple list
    list_output = output_results(flagged_items, 'list')
    with open('risk_results.txt', 'w') as f:
        f.write(list_output)
    
    print(f"Found {len(flagged_items)} flagged items. Results saved to risk_results.json and risk_results.txt")

if __name__ == "__main__":
    main()