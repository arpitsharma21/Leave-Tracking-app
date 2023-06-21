import { LightningElement, wire } from 'lwc';
// importing func from class which takes al the leaves present in an obj using sql
import getMyLeaves from '@salesforce/apex/LeaveRequstController.getMyLeaves';
// used for showing success or failure message
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// getting current user ID
import Id from '@salesforce/user/Id';
// used for refreshing the browser automatically so that we don't have to manually refresh it 
import { refreshApex } from '@salesforce/apex';

// used for defining which columns to be shown in a table with specific class 'cellClass' which helps in defining different colours 
const COLUMNS = [
    { label: 'Request Id', fieldName: 'Name', cellAttributes: { class: { fieldName: 'cellClass' } } },
    { label: 'From Date', fieldName: 'From_Date__c', cellAttributes: { class: { fieldName: 'cellClass' } } },
    { label: 'To Date', fieldName: 'To_Date__c', cellAttributes: { class: { fieldName: 'cellClass' } } },
    { label: 'Reason', fieldName: 'Reason__c', cellAttributes: { class: { fieldName: 'cellClass' } } },
    { label: 'Status', fieldName: 'Status__c', cellAttributes: { class: { fieldName: 'cellClass' } } },
    { label: 'Manager Comment', fieldName: 'Manager_Comment__c', cellAttributes: { class: { fieldName: 'cellClass' } } },
    {
        type: "button", typeAttributes: {
            label: 'Edit',
            name: 'Edit',
            title: 'Edit',
            value: 'edit',
            disabled: { fieldName: 'isEditDisabled' }
        }, cellAttributes: { class: { fieldName: 'cellClass' } }
    }
];

export default class MyLeaves extends LightningElement {
    columns = COLUMNS;
    // used for storing leaves data and returning to lwc component
    myLeaves = [];
    myLeavesWireResult;
    // used for closing the edit form
    showModalPopup = false;
    // defining which object to be used for edit form
    objectApiName = 'LeaveRequest__c';
    recordId = '';
    // getting current user id 
    currentUserId = Id;

    @wire(getMyLeaves)
    wiredMyLeaves(result) {
        this.myLeavesWireResult = result;
        if (result.data) {
            // mapping all the data in myLeaves array with some css involved like green colur for approved and red for rejected Status 
            this.myLeaves = result.data.map(a => ({
                // this is rest operator which gathers all the remaining  arguments or to get  all the arguments
                ...a,
                cellClass: a.Status__c == 'Approved' ? 'slds-theme_success' : a.Status__c == 'Rejected' ? 'slds-theme_warning' : '',
                isEditDisabled: a.Status__c != 'Pending'
            }));
        }
        if (result.error) {
            console.log('Error occured while fetching my leaves- ', result.error);
        }
    }

    // this method is used when there is no data available and we have to show no data found on lwc as it checks the length of myLeaves to be 0
    get noRecordsFound() {
        return this.myLeaves.length == 0;
    }

    // used to create new leave request in edit form when making showModalPopup true
    newRequestClickHandler() {
        this.showModalPopup = true;
        this.recordId = '';
    }

    // used to close the edit form by pressing the (X) in LWC
    popupCloseHandler() {
        this.showModalPopup = false;
    }

    // we cannot directly have the present 
    rowActionHandler(event) {
        this.showModalPopup = true;
        this.recordId = event.detail.row.Id;
    }

    // used for showing success message when record is created or updated and closing the edit form
    successHandler(event) {
        this.showModalPopup = false;
        this.showToast('Data saved successfully');

        // used for refreshing the table automatically when record is created or updated
        refreshApex(this.myLeavesWireResult);
        const refreshEvent = new CustomEvent('refreshleaverequests');
        this.dispatchEvent(refreshEvent);
    }

    // On submitting new record it will aplly validation on the Date field and assign Status firld to be pending
    submitHandler(event) {
        event.preventDefault();
        // this is rest operator which gathers all the remaining  arguments or to get  all the arguments and getting all the fields data for a 
        // particular record
        const fields = { ...event.detail.fields };
        fields.Status__c = 'Pending';
        // checking if from date is less than today's date
        if (new Date(fields.From_Date__c) > new Date(fields.To_Date__c)) {
            this.showToast('From date should not be grater then to date', 'Error', 'error');
        }
        else if (new Date() > new Date(fields.From_Date__c)) {
            this.showToast('From date should not be less then Today', 'Error', 'error');
        }
        else {
            this.refs.leaveReqeustFrom.submit(fields);
        }
    }

    // used for defining the message to be shown in LWC
    showToast(message, title = 'success', variant = 'success') {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
}