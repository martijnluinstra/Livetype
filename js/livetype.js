/*************************************************
 *                 Livetype base                 *
 *************************************************/

function Livetype(selector) {
    var livetypeRoot = document.querySelector(selector);
    livetypeRoot.innerHTML = '\
        <div class="livetype-container">\
            <span id="livetype-target"></span>\
        </div>\
        <form id="livetype-form">\
            <textarea id="livetype-source" placeholder="Type here..." rows="1" autocomplete="off" autofocus></textarea>\
            <button id="livetype-reset" type="button">&times;</button>\
        </form>';
    var source = livetypeRoot.querySelector('#livetype-source');
    var dest = livetypeRoot.querySelector('#livetype-target');
    var autodisplay = false;
    var timer;

    var revisions = [];

    emojione.imageType='svg';

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }


    function displayText() {
        var text = escapeHtml(source.value);
        text = text.replace(/\n/g, '<br>');
        text = emojione.toImage(text);
        
        var rev_string = revisions.join('');

        if (rev_string == text) 
            return;

        for (var rev = revisions.length; rev > 0 && text.indexOf(rev_string) != 0; rev --)
            rev_string = revisions.slice(0, rev).join('');

        var remove_start = -1;
        var remove_end = revisions.length;

        if (rev <= 0 ){
            remove_start = 0;
            revisions = [];
            rev_string = '';
        } else if (rev < revisions.length) {
            remove_start = rev+1; 
            revisions.splice(remove_start, revisions.length-rev);
        }

        var cur_rev = text.substring(rev_string.length, text.length);

        var rev_element = document.createElement('span');
        rev_element.id = 'rev-' + revisions.length;
        rev_element.innerHTML = cur_rev;
        dest.appendChild(rev_element);
        
        if (remove_start > -1)
            for (var idx=remove_start; idx < remove_end; idx++)
                dest.removeChild(document.getElementById('rev-'+idx));

        revisions.push(cur_rev);
    }


    function livetype_listener(evt) {
        clearTimeout(timer);
        var value = source.value;
        if (source.value.endsWith(' ') || source.value.endsWith('\n') || !source.value)
            displayText();
        if (!autodisplay)
            timer = setTimeout(displayText, 1000);
    }

    source.addEventListener('keyup', livetype_listener);
    source.addEventListener('change', livetype_listener);

    source.addEventListener('startAutocomplete', function(){
        clearTimeout(timer);
        autodisplay = true;
    });
    source.addEventListener('stopAutocomplete', function(){
        timer = setTimeout(displayText, 1000);
        autodisplay = false;
    });

    livetypeRoot.querySelector('#livetype-reset').addEventListener('click', function(evt){
        source.value = '';
        displayText();
    });

    livetypeRoot.querySelector('#livetype-form').addEventListener('submit', function(evt){
        evt.preventDefault();
    });
}

Livetype('.livetype');

function applyToSelector (selector, map) {
    var elementList = document.querySelectorAll(selector);
    for (var i = 0; i < elementList.length; i++)
        map.call(elementList[i]);
}

document.getElementById('increase-fontsize').addEventListener('click', function(evt){
    applyToSelector('.livetype-container', function(){
        var size = parseInt(this.style.fontSize) || 15;
        if (size < 50) this.style.fontSize = (size+5) + 'vh';
    });
});

document.getElementById('decrease-fontsize').addEventListener('click', function(evt){
    applyToSelector('.livetype-container', function(){
        var size = parseInt(this.style.fontSize) || 15;
        if (size > 5) this.style.fontSize = (size-5) + 'vh';
    });
});

document.addEventListener('click', function(){
    document.getElementById('livetype-source').focus();
});


/*************************************************
 *             EmojiOne autocomplete             *
 *************************************************/

// emoji strategy for .textcomplete() (latest version available in our repo: emoji_strategy.json)
var emojiStrategy = {};
$.getJSON('https://raw.githubusercontent.com/Ranks/emojione/master/emoji_strategy.json', function(data){
    emojiStrategy = data;
});

$(document).ready(function() {
 
    $("textarea").textcomplete([ {
        match: /\B:([\-+\w]*)$/,
        search: function (term, callback) {
            var results = [];
            var results2 = [];
            var results3 = [];
            $.each(emojiStrategy,function(shortname,data) {
                if(shortname.indexOf(term) > -1) { results.push(shortname); }
                else {
                    if((data.aliases !== null) && (data.aliases.indexOf(term) > -1)) {
                        results2.push(shortname);
                    }
                    else if((data.keywords !== null) && (data.keywords.indexOf(term) > -1)) {
                        results3.push(shortname);
                    }
                }
            });
 
            if(term.length >= 3) {
                results.sort(function(a,b) { return (a.length > b.length); });
                results2.sort(function(a,b) { return (a.length > b.length); });
                results3.sort();
            }
            var newResults = results.concat(results2).concat(results3);
 
            callback(newResults);
        },
        template: function (shortname) {
            return '<img class="emojione" src="//cdn.jsdelivr.net/emojione/assets/png/'+emojiStrategy[shortname].unicode+'.png"> :'+shortname+':';
        },
        replace: function (shortname) {
            // $(this.el).trigger('keyup',  {which: 50});
            return ':'+shortname+': ';
        },
        index: 1,
        maxCount: 10
    }
    ],{
        placement: 'top',
        footer: '<a href="http://www.emoji.codes" target="_blank">Browse All<span class="arrow">»</span></a>'
    }).on({
        'textComplete:select': function (e, value, strategy) {
            this.dispatchEvent(new Event('change'));
        },
        'textComplete:show': function (e) {
            this.dispatchEvent(new CustomEvent('startAutocomplete'));
        },
        'textComplete:hide': function (e) {
            this.dispatchEvent(new CustomEvent('stopAutocomplete'));
        }
    });
});
