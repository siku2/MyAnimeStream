## How to handle these incredible log files...

#### File format:
```
version: <version>
release: <release_date>
---
<logs>
```

#### Log format:
```yaml
<type><[<priority>] (optional)>: <text style (YAML)> <text>;
```


## Examples
```yaml
added: A changelog parser to parse this file;
```
```yaml
CHANGED[2]: >
            The type will be capitalised internally
            and your text can span over multiple lines!
            It will even get dedented;
```
```yaml
DEPRECATED: |
If you want to have your text all over the place (I mean, why not?)
            you can use the pipe character;
```
```yaml
	security: Feel free to indent your things btw, doesn't really matter;
```
```yaml
// Comments are also a thing
Actually, everything is a comment as long as it doesn't match the above format so knock yourself out
   mind_you_comma_if: you write like this, it will be detected if you don't add the //;
//quack: this won't break a thing;
```