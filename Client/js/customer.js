class CustomerPage {

  constructor() {
    this.state = {
      customerId: "",
      customer: null,
      states: []
    };

    // instance variables that the app needs but are not part of the "state" of the application
    this.server = "http://localhost:5000/api"
    this.url = this.server + "/customers";

    // instance variables related to ui elements simplifies code in other places
    this.$form = document.querySelector('#customerForm');
    this.$customerId = document.querySelector('#customerId');
    this.$customerName = document.querySelector('#name');
    this.$customerAddress = document.querySelector('#address');
    this.$customerCity = document.querySelector('#city');
    this.$customerState = document.querySelector('#state');
    this.$customerZipcode = document.querySelector('#zipcode');
    this.$findButton = document.querySelector('#findBtn');
    this.$addButton = document.querySelector('#addBtn');
    this.$deleteButton = document.querySelector('#deleteBtn');
    this.$editButton = document.querySelector('#editBtn');
    this.$saveButton = document.querySelector('#saveBtn');
    this.$cancelButton = document.querySelector('#cancelBtn');

    // call these methods to set up the page
    this.bindAllMethods();
    this.fetchStates();
    this.makeFieldsReadOnly(true);
    this.makeFieldsRequired(false);
    this.enableButtons("pageLoad");

  }

  // any method that is used as part of an event handler must bind this to the class
  // not all of these methods need to be bound but it was easier to do them all as I wrote them
  bindAllMethods() {
    this.onFindCustomer = this.onFindCustomer.bind(this);
    this.onEditCustomer = this.onEditCustomer.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onDeleteCustomer = this.onDeleteCustomer.bind(this);
    this.onSaveCustomer = this.onSaveCustomer.bind(this);
    this.onAddCustomer = this.onAddCustomer.bind(this);

    this.fetchStates = this.fetchStates.bind(this);
    this.loadStates = this.loadStates.bind(this);
    this.makeFieldsReadOnly = this.makeFieldsReadOnly.bind(this);
    this.makeFieldsRequired = this.makeFieldsRequired.bind(this);
    this.fillCustomerFields = this.fillCustomerFields.bind(this);
    this.clearCustomerFields = this.clearCustomerFields.bind(this);
    this.disableButtons = this.disableButtons.bind(this);
    this.disableButton = this.disableButton.bind(this);
    this.enableButtons = this.enableButtons.bind(this);
  }

  // makes an api call to /api/states to get the list of states
  // populates the combo box on the page with the state information
  fetchStates() {
    fetch(`${this.server}/states`)
    .then(response => response.json())
    .then(data => { 
      if (data.length == 0) {
        alert("Can't load states.  Can not add or edit customers without state inforamtion.");
      }
      else {
        this.state.states = data;
        this.loadStates();
      }
    })
    .catch(error => {
      alert('There was a problem getting customer info!'); 
    });
  }

  // creates an option for each of the states returned from the api call
  loadStates() {
    let defaultOption = `<option value="" ${(!this.state.customer)?"selected":""}></option>`;
    let stateHtml = this.state.states.reduce(
      (html, state, index) => html += this.loadState(state, index), defaultOption
    );
    this.$customerState.innerHTML = stateHtml;
  }

  // creates the option for one state
  loadState(state, index) {
    return `<option value=${state.stateCode} ${(this.state.customer && this.state.customer.stateCode == state.stateCode)?"selected":""}>${state.stateName}</option>`;
  }

  // makes an api call to /api/customer/# where # is the primary key of the customer
  // finds a customer based on customer id.  in a future version it would be better to search by name
  onFindCustomer(event) {
    event.preventDefault();
    if (this.$customerId.value != "") {
      this.state.customerId = this.$customerId.value;
      fetch(`${this.url}/${this.state.customerId}`)
      .then(response => response.json())
      .then(data => { 
        if (data.status == 404) {
          alert('That customer does not exist in our database'); 
        }
        else {
          this.state.customer = data;
          this.fillCustomerFields();
          this.enableButtons("found");
        }
      })
      .catch(error => {
        alert('There was a problem getting customer info!'); 
      });
    }
    else {
      this.clearCustomerFields();
    }
  }

  // makes a delete request to /api/customer/# where # is the primary key of the customer
  // deletes the customer displayed on the screen from the database
  onDeleteCustomer(event) {
    event.preventDefault();
    if (this.state.customerId != "") {
      fetch(`${this.url}/${this.state.customerId}`, {method: 'DELETE'})
      .then(response => response.json())
      .then(data => { 
        // returns the record that we deleted so the ids should be the same 
        if (this.state.customerId == data.customerId)
        {
          this.state.customerId = "";
          this.state.customer = null;
          this.$customerId.value = "";
          this.clearCustomerFields();
          this.enableButtons("pageLoad");
          alert("Customer was deleted.")
        }
        else{
          alert('There was a problem deleting customer info!'); 
        }
      })
      .catch(error => {
        alert('There was a problem deleting customer info!'); 
      });
    }
    else {
      // this should never happen if the right buttons are enabled
    }
  }

  // makes either a post or a put request to /api/customers
  // either adds a new customer or updates an existing customer in the database
  // based on the customer information in the form
  onSaveCustomer(event) {
    event.preventDefault();
    // adding
    if (this.state.customerId == "") {
      fetch(`${this.url}`, {
        method: 'POST', 
        body: JSON.stringify({
          customerId: 0, 
          name: this.$customerName.value,
          address: this.$customerAddress.value,
          city: this.$customerCity.value,
          stateCode: this.$customerState.value,
          zipCode: this.$customerZipcode.value,
          invoices: [], 
          state: null
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => { 
        // returns the record that we added so the ids should be there 
        if (data.customerId)
        {
          this.state.customerId = data.customerId;
          this.state.customer = data;
          this.$customerId.value = this.state.customerId;
          this.fillCustomerFields();
          this.$customerId.readOnly = false;
          this.enableButtons("found");
          alert("Customer was added.")
        }
        else{
          alert('There was a problem adding customer info!'); 
        }
      })
      .catch(error => {
        alert('There was a problem adding customer info!'); 
      });
    }
    // updating
    else {
      // the format of the body has to match the original object exactly 
      // so make a copy of it and copy the values from the form
      let customer = Object.assign(this.state.customer);
      customer.name = this.$customerName.value;
      customer.address = this.$customerAddress.value;
      customer.city = this.$customerCity.value;
      customer.stateCode = this.$customerState.value;
      customer.zipCode = this.$customerZipcode.value;
      fetch(`${this.url}/${this.state.customerId}`, {
        method: 'PUT', 
        body: JSON.stringify(customer),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        // doesn't return a body just a status code of 204 
        if (response.status == 204)
        {
          this.state.customer = Object.assign(customer);
          this.fillCustomerFields();
          this.$customerId.readOnly = false;
          this.enableButtons("found");
          alert("Customer was updated.")
        }
        else{
          alert('There was a problem updating customer info!'); 
        }
      })
      .catch(error => {
        alert('There was a problem adding customer info!'); 
      });
    }
  }

  // makes the fields editable
  onEditCustomer(event) {
    event.preventDefault();
    // can't edit the customer id
    this.$customerId.readOnly = true;
    this.makeFieldsReadOnly(false);
    this.makeFieldsRequired(true);
    this.enableButtons("editing");
  }

  // clears the form for input of a new customer
  onAddCustomer(event) {
    event.preventDefault();
    // can't edit the customer id
    this.state.customerId = ""
    this.state.customer = null;
    this.$customerId.value = "";
    this.$customerId.readOnly = true;
    this.clearCustomerFields();
    this.makeFieldsReadOnly(false);
    this.makeFieldsRequired(true);
    this.enableButtons("editing");
  }

  // cancels the editing for either a new customer or an existing customer
  onCancel(event) {
    event.preventDefault();
    if (this.state.customerId == "") {
      this.clearCustomerFields();
      this.makeFieldsReadOnly();
      this.makeFieldsRequired(false);
      this.$customerId.readOnly = false;
      this.enableButtons("pageLoad");
    }
    else {
      this.fillCustomerFields();
      this.$customerId.readOnly = false;
      this.enableButtons("found");
    }
  }

  // fills the form with data based on the customer
  fillCustomerFields() {
    // fill the fields
    this.$customerName.value = this.state.customer.name;
    this.$customerAddress.value = this.state.customer.address;
    this.$customerCity.value = this.state.customer.city;
    this.loadStates();
    this.$customerZipcode.value = this.state.customer.zipCode;
    this.makeFieldsReadOnly();
  }

  // clears the ui
  clearCustomerFields() {
    this.$customerName.value = "";
    this.$customerAddress.value = "";
    this.$customerCity.value = "";
    this.loadStates();
    this.$customerZipcode.value = "";
  }

  // enables or disables ui elements
  makeFieldsReadOnly(readOnly=true) {
    this.$customerName.readOnly = readOnly;
    this.$customerAddress.readOnly = readOnly;
    this.$customerCity.readOnly = readOnly;
    this.$customerState.readOnly = readOnly;
    this.$customerZipcode.readOnly = readOnly;
  }

  // makes ui elements required when editing
  makeFieldsRequired(required=true) {
    this.$customerName.required = required;
    this.$customerAddress.required = required;
    this.$customerCity.required = required;
    //this.$customerState.required = required;
    this.$customerZipcode.required = required;
  }

  // disables an array of buttons
  disableButtons(buttons) {
    buttons.forEach(b => b.onclick = this.disableButton); 
    buttons.forEach(b => b.classList.add("disabled"));
  }

  // disables one button
  disableButton(event) {
    event.preventDefault();
  }

  // enables ui elements based on the editing state of the page
  enableButtons(state) {
    switch (state){
      case "pageLoad":
        this.disableButtons([this.$deleteButton, this.$editButton, this.$saveButton, this.$cancelButton]);
        this.$findButton.onclick = this.onFindCustomer;
        this.$findButton.classList.remove("disabled");
        this.$addButton.onclick = this.onAddCustomer;
        this.$addButton.classList.remove("disabled");
        break;
      case "editing": case "adding":
        this.disableButtons([this.$deleteButton, this.$editButton, this.$addButton]);
        this.$saveButton.onclick = this.onSaveCustomer;
        this.$cancelButton.onclick = this.onCancel;
        [this.$saveButton, this.$cancelButton].forEach(b => b.classList.remove("disabled"));
        break;
      case "found":
        this.disableButtons([this.$saveButton, this.$cancelButton]);
        this.$findButton.onclick = this.onFindCustomer;
        this.$editButton.onclick = this.onEditCustomer;
        this.$deleteButton.onclick = this.onDeleteCustomer;
        this.$addButton.onclick = this.onAddCustomer;
        [this.$findButton, this.$editButton, this.$deleteButton, this.$addButton].forEach(b => b.classList.remove("disabled"));
        break;
      default:
    }
  }
}

// instantiate the js app when the html page has finished loading
window.addEventListener("load", () => new CustomerPage());
